const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();


// Auth
exports.createUser = functions.https.onCall(async(data, context) => {
        // if(!context.auth) throw new Error('Unauthenticated');

        const {displayName, uid } = data;

        const userId = uid;

        await db.collection('User').doc(userId).set({
          userId,
          displayName,
          createdAt: admin.firestore.Timestamp.now()
        });

        return { success: true, userId };
      });

exports.getUser = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const doc = await db.collection('User').doc(context.auth.uid).get();
    return doc.exists ? doc.data() : null;
});

// Dashboard
exports.getUserMedications = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const snapshot = await db.collection('Medication')
        .where('user', '==', db.collection('User').doc(context.auth.uid))
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
});

exports.getTodayAdherence = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await db.collection('AdherenceRecord')
        .where('user', '==', db.collection('User').doc(context.auth.uid))
        .where('date', '==', admin.firestore.Timestamp.fromDate(today))
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

// Med Management
exports.createMedication = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const { name, dose, capsuleQuantity, takesMorning, takesAfternoon, takesEvening, notes } = data;

    const docRef = await db.collection('Medication').add({
        user: db.collection('User').doc(context.auth.uid),
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

exports.getAllMedications = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const snapshot = await db.collection('Medication')
        .where('user', '==', db.collection('User').doc(context.auth.uid))
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

exports.updateMedication = functions.https.onCall(async (data,context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const{ medicationId, ...updateData } = data;

    await db.collection('Medication').doc(data.medicationId).update(updateData);

    return {success: true};
});

exports.deleteMedication = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    await db.collection('Medication').doc(data.medicationId).delete();

    return { success: true } ;
});

// dose log
exports.logAdherence = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const { medicationId, date, timeSlot, taken } = data;

    const docRef = await db.collection('AdherenceRecord').add({
        user: db.collection('User').doc(context.auth.uid),
        medication: db.collection('Medication').doc(medicationId),
        date: admin.firestore.Timestamp.fromDate(new Date(date)),
        timeSlot,
        taken,
        takenAt: taken ? admin.firestore.Timestamp.now() : null,
        createdAt: admin.firestore.Timestamp.now()
    });

    return {success: true, adherenceId: docRef.id};
});

exports.getAdherenceByDateRange = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const { startDate, endDate } = data;

    const snapshot = await db.collection('AdherenceRecord')
        .where('user', '==', db.collection('User').doc(context.auth.uid))
        .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)))
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

exports.updateAdherence = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const { adherenceId, taken } = data;

    await db.collection('AdherenceRecord').doc(adherenceId).update({
        taken,
        takenAt: taken ? admin.firestore.Timestamp.now() : null
    });

    return { success: true };
});

//friends
exports.createFriendshipRequest = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const { recipientId } = data;

    const docRef = await db.collection('Friendship').add({
        requestor: db.collection('User').doc(context.auth.uid),
        recipient: db.collection('User').doc(recipientId),
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now()
    });

    return { success: true, friendshipId: docRef.id };
});

exports.updateFriendshipStatus = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const { friendshipId, status } = data;

    await db.collection('Friendship').doc(friendshipId).update({ status });

    return {success: true};
});

exports.getUserFriendships = functions.https.onCall(async (data, context) => {
    if(!context.auth) throw new Error('Unauthenticated');

    const snapshot = await db.collection('Friendship')
        .where('requestor', '==', db.collection('User').doc(context.auth.uid))
        .get();

    const snapshot2 = await db.collection('Friendship')
        .where('recipient', '==', db.collection('User').doc(context.auth.uid))
        .get();

    const friendships = [
        ...snapshot.docs.map(doc => ({id: doc.id, ...doc.data() })),
        ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];

    return friendships;
});