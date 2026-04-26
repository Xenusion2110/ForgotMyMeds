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
    return doc.exists ? doc.data() : null;
});

// Dashboard
exports.getUserMedications = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);

    const snapshot = await db.collection('Medication')
        .where('user', '==', db.collection('User').doc(uid))
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
});

exports.getTodayAdherence = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await db.collection('AdherenceRecord')
        .where('user', '==', db.collection('User').doc(uid))
        .where('date', '==', admin.firestore.Timestamp.fromDate(today))
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

// Med Management
exports.createMedication = onCall(callableOptions, async (request) => {
    const { uid } = await requireAuth(request);

    const { name, dose, capsuleQuantity, takesMorning, takesAfternoon, takesEvening, notes } = request.data;

    const docRef = await db.collection('Medication').add({
        user: db.collection('User').doc(uid),
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

    const snapshot = await db.collection('Medication')
        .where('user', '==', db.collection('User').doc(uid))
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        user: db.collection('User').doc(uid),
        medication: db.collection('Medication').doc(medicationId),
        date: admin.firestore.Timestamp.fromDate(new Date(date)),
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

    const snapshot = await db.collection('AdherenceRecord')
        .where('user', '==', db.collection('User').doc(uid))
        .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)))
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    const { recipientId } = request.data;

    const docRef = await db.collection('Friendship').add({
        requestor: db.collection('User').doc(uid),
        recipient: db.collection('User').doc(recipientId),
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

    const snapshot = await db.collection('Friendship')
        .where('requestor', '==', db.collection('User').doc(uid))
        .get();

    const snapshot2 = await db.collection('Friendship')
        .where('recipient', '==', db.collection('User').doc(uid))
        .get();

    const friendships = [
        ...snapshot.docs.map(doc => ({id: doc.id, ...doc.data() })),
        ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];

    return friendships;
});
