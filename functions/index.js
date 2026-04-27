const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const callableOptions = {
    invoker: 'public',
};

const userRef = (uid) => db.collection('User').doc(uid);
const localDateToTimestamp = (value) => admin.firestore.Timestamp.fromDate(new Date(`${value}T00:00:00.000Z`));

const timestampToIso = (value) => {
    return value?.toDate ? value.toDate().toISOString() : null;
};

const timestampToDateString = (value) => {
    return value?.toDate ? value.toDate().toISOString().slice(0, 10) : null;
};

const compareDateKeys = (left, right) => {
    if (!left && !right) {
        return 0;
    }

    if (!left) {
        return -1;
    }

    if (!right) {
        return 1;
    }

    return left.localeCompare(right);
};

const serializeUserSnapshot = (doc) => {
    const data = doc.data() || {};

    return {
        id: doc.id,
        userId: data.userId || doc.id,
        displayName: data.displayName || '',
        email: data.email || '',
        createdAt: timestampToIso(data.createdAt),
    };
};

const serializeMedicationSnapshot = (doc) => {
    const data = doc.data() || {};

    return {
        id: doc.id,
        userId: data.user?.id || null,
        name: data.name || '',
        dose: data.dose || '',
        capsuleQuantity: data.capsuleQuantity || 0,
        notes: data.notes || '',
        takesMorning: Boolean(data.takesMorning),
        takesAfternoon: Boolean(data.takesAfternoon),
        takesEvening: Boolean(data.takesEvening),
        createdAt: timestampToIso(data.createdAt),
    };
};

const loadMedicationMap = async (docs) => {
    const medicationIds = [...new Set(
        docs
            .map((doc) => doc.data()?.medication?.id)
            .filter(Boolean)
    )];

    if (!medicationIds.length) {
        return new Map();
    }

    const medicationDocs = await Promise.all(
        medicationIds.map((medicationId) => db.collection('Medication').doc(medicationId).get())
    );

    return new Map(
        medicationDocs
            .filter((doc) => doc.exists)
            .map((doc) => [doc.id, serializeMedicationSnapshot(doc)])
    );
};

const serializeAdherenceSnapshot = (doc, medicationMap = new Map()) => {
    const data = doc.data() || {};
    const medicationId = data.medication?.id || null;
    const medication = medicationId ? medicationMap.get(medicationId) : null;

    return {
        id: doc.id,
        userId: data.user?.id || null,
        medicationId,
        medicationName: medication?.name || '',
        medicationDose: medication?.dose || '',
        date: timestampToDateString(data.date),
        timeSlot: data.timeSlot || '',
        taken: Boolean(data.taken),
        takenAt: timestampToIso(data.takenAt),
        createdAt: timestampToIso(data.createdAt),
    };
};

const serializeFriendshipSnapshot = (doc, friendUser, adherenceRecords) => {
    const data = doc.data() || {};
    const takenCount = adherenceRecords.filter((record) => record.taken).length;
    const totalRecords = adherenceRecords.length;

    return {
        id: doc.id,
        status: data.status || '',
        createdAt: timestampToIso(data.createdAt),
        requestorId: data.requestor?.id || null,
        recipientId: data.recipient?.id || null,
        friend: friendUser,
        adherence: {
            records: adherenceRecords,
            takenCount,
            totalRecords,
            adherencePercent: totalRecords ? Math.round((takenCount / totalRecords) * 100) : null,
        },
    };
};

const getMedicationDocsForUser = async (uid) => {
    const snapshot = await db.collection('Medication')
        .where('user', '==', userRef(uid))
        .get();

    return snapshot.docs.map((doc) => serializeMedicationSnapshot(doc));
};

const getAdherenceDocsForQuery = async (query) => {
    const snapshot = await query.get();
    const medicationMap = await loadMedicationMap(snapshot.docs);

    return snapshot.docs.map((doc) => serializeAdherenceSnapshot(doc, medicationMap));
};

const getAllAdherenceForUser = async (uid) => {
    return getAdherenceDocsForQuery(
        db.collection('AdherenceRecord')
            .where('user', '==', userRef(uid))
    );
};

const getTodayAdherenceForUser = async (uid, dateString) => {
    const targetDate = dateString || new Date().toISOString().slice(0, 10);
    const adherenceRecords = await getAllAdherenceForUser(uid);

    return adherenceRecords.filter((record) => record.date === targetDate);
};

const requireAuth = async (request) => {
    if (request.auth) {
        return {
            uid: request.auth.uid,
            token: request.auth.token,
        };
    }

    const idToken = request.data?.idToken;

    if (!idToken) {
        throw new HttpsError('unauthenticated', 'No sign-in token was sent.');
    }

    try {
        const token = await getAuth().verifyIdToken(idToken);
        return {
            uid: token.uid,
            token,
        };
    } catch (err) {
        throw new HttpsError('unauthenticated', `Sign-in token could not be verified: ${err.code || err.message}`);
    }
};


// Auth
exports.createUser = onCall(callableOptions, async (request) => {
    const { uid, token } = await requireAuth(request);
    const displayName = request.data?.displayName || '';
    const email = token?.email || null;

    await db.collection('User').doc(uid).set(
        {
            userId: uid,
            displayName,
            email,
            createdAt: admin.firestore.Timestamp.now(),
        },
        { merge: true }
    );

    return { success: true, userId: uid };
});

exports.getUser = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);

    const doc = await db.collection('User').doc(uid).get();
    return doc.exists ? serializeUserSnapshot(doc) : null;
});

// Dashboard
exports.getUserMedications = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);

    return getMedicationDocsForUser(uid);
});

exports.getTodayAdherence = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);
    const date = request.data?.date;

    return getTodayAdherenceForUser(uid, date);
});

// Med Management
exports.createMedication = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);

    const { name, dose, capsuleQuantity, takesMorning, takesAfternoon, takesEvening, notes } = request.data;

    const docRef = await db.collection('Medication').add({
        user: userRef(uid),
        name,
        dose,
        capsuleQuantity,
        takesMorning,
        takesAfternoon,
        takesEvening,
        notes: notes || null,
        createdAt: admin.firestore.Timestamp.now()
    });

    return{ success: true, medicationId: docRef.id };
});

exports.getAllMedications = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);

    return getMedicationDocsForUser(uid);
});

exports.updateMedication = onCall(callableOptions, async (request) => {
    await requireAuth(request);

    const{ medicationId, idToken, ...updateData } = request.data;

    await db.collection('Medication').doc(medicationId).update(updateData);

    return {success: true};
});

exports.deleteMedication = onCall(callableOptions, async (request) => {
    await requireAuth(request);

    await db.collection('Medication').doc(request.data.medicationId).delete();

    return { success: true } ;
});

// dose log
exports.logAdherence = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);

    const { medicationId, date, timeSlot, taken } = request.data;

    const docRef = await db.collection('AdherenceRecord').add({
        user: userRef(uid),
        medication: db.collection('Medication').doc(medicationId),
        date: localDateToTimestamp(date),
        timeSlot,
        taken,
        takenAt: taken ? admin.firestore.Timestamp.now() : null,
        createdAt: admin.firestore.Timestamp.now()
    });

    return {success: true, adherenceId: docRef.id};
});

exports.getAdherenceByDateRange = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);

    const { startDate, endDate } = request.data;
    const adherenceRecords = await getAllAdherenceForUser(uid);

    return adherenceRecords
        .filter((record) => (
            compareDateKeys(record.date, startDate) >= 0 &&
            compareDateKeys(record.date, endDate) <= 0
        ))
        .sort((left, right) => compareDateKeys(right.date, left.date));
});

exports.updateAdherence = onCall(callableOptions, async (request) => {
    await requireAuth(request);

    const { adherenceId, taken } = request.data;

    await db.collection('AdherenceRecord').doc(adherenceId).update({
        taken,
        takenAt: taken ? admin.firestore.Timestamp.now() : null
    });

    return { success: true };
});

//friends
exports.createFriendshipRequest = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);
    const rawRecipientId = request.data?.recipientId?.trim() || '';
    const rawRecipientEmail = request.data?.recipientEmail?.trim().toLowerCase() || '';
    const recipientEmail = rawRecipientEmail || (rawRecipientId.includes('@') ? rawRecipientId.toLowerCase() : '');
    let recipientId = recipientEmail ? '' : rawRecipientId;

    if (recipientEmail) {
        const recipientSnapshot = await db.collection('User')
            .where('email', '==', recipientEmail)
            .limit(1)
            .get();

        if (recipientSnapshot.empty) {
            throw new HttpsError('not-found', 'No user was found for that email.');
        }

        recipientId = recipientSnapshot.docs[0].id;
    }

    if (!recipientId) {
        throw new HttpsError('invalid-argument', 'A friend email or user ID is required.');
    }

    if (recipientId === uid) {
        throw new HttpsError('invalid-argument', 'You cannot add yourself as a friend.');
    }

    const recipientDoc = await db.collection('User').doc(recipientId).get();

    if (!recipientDoc.exists) {
        throw new HttpsError('not-found', 'No user was found for that user ID.');
    }

    const outgoingSnapshot = await db.collection('Friendship')
        .where('requestor', '==', userRef(uid))
        .get();
    const hasOutgoingFriendship = outgoingSnapshot.docs.some((doc) => (
        doc.data()?.recipient?.id === recipientId
    ));

    const incomingSnapshot = await db.collection('Friendship')
        .where('requestor', '==', userRef(recipientId))
        .get();
    const hasIncomingFriendship = incomingSnapshot.docs.some((doc) => (
        doc.data()?.recipient?.id === uid
    ));

    if (hasOutgoingFriendship || hasIncomingFriendship) {
        throw new HttpsError('already-exists', 'A friendship request already exists for this user.');
    }

    const docRef = await db.collection('Friendship').add({
        requestor: userRef(uid),
        recipient: userRef(recipientId),
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now()
    });

    return { success: true, friendshipId: docRef.id };
});

exports.updateFriendshipStatus = onCall(callableOptions, async (request) => {
    await requireAuth(request);

    const { friendshipId, status } = request.data;

    await db.collection('Friendship').doc(friendshipId).update({ status });

    return {success: true};
});

exports.getUserFriendships = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);
    const date = request.data?.date;

    const snapshot = await db.collection('Friendship')
        .where('requestor', '==', userRef(uid))
        .get();

    const snapshot2 = await db.collection('Friendship')
        .where('recipient', '==', userRef(uid))
        .get();

    const friendshipDocs = [...snapshot.docs, ...snapshot2.docs];
    const friendIds = [...new Set(
        friendshipDocs
            .map((doc) => {
                const data = doc.data() || {};

                return data.requestor?.id === uid ? data.recipient?.id : data.requestor?.id;
            })
            .filter(Boolean)
    )];

    const friendUsers = await Promise.all(
        friendIds.map((friendId) => db.collection('User').doc(friendId).get())
    );
    const friendUserMap = new Map(
        friendUsers
            .filter((doc) => doc.exists)
            .map((doc) => [doc.id, serializeUserSnapshot(doc)])
    );

    const friendAdherenceEntries = await Promise.all(
        friendIds.map(async (friendId) => [friendId, await getTodayAdherenceForUser(friendId, date)])
    );
    const friendAdherenceMap = new Map(friendAdherenceEntries);

    return friendshipDocs.map((doc) => {
        const data = doc.data() || {};
        const friendId = data.requestor?.id === uid ? data.recipient?.id : data.requestor?.id;
        const friendUser = friendId ? friendUserMap.get(friendId) || null : null;
        const adherenceRecords = friendId ? friendAdherenceMap.get(friendId) || [] : [];

        return serializeFriendshipSnapshot(doc, friendUser, adherenceRecords);
    });
});
