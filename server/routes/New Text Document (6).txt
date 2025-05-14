// PATCH /api/attempts/finalize
router.patch('/finalize', async (req, res) => {
  const { userId, promoName } = req.body;

  if (!userId || !promoName) {
    return res.status(400).json({ error: 'Missing userId or promoName' });
  }

  const attemptDoc = await AdAttempt.findOne({ userId, promoName });
  if (!attemptDoc) {
    return res.status(404).json({ error: 'Ad attempt not found' });
  }

  attemptDoc.isFinal = true;
  await attemptDoc.save();

  res.json({ message: 'Ad finalized successfully' });
});
