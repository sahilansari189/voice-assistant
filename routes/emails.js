const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Email = require('../models/Email');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.get('/', async (req, res) => {
  try {
    const emails = await Email.find({ to: req.user.email })
      .sort({ createdAt: -1 });
    res.json(emails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { to, subject, body, attachments } = req.body;

    await transporter.sendMail({
      from: req.user.email,
      to,
      subject,
      text: body,
      attachments
    });

    const email = new Email({
      from: req.user.email,
      to,
      subject,
      body,
      attachments,
      status: 'sent'
    });

    await email.save();
    res.status(201).json(email);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const email = await Email.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(email);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Email.findByIdAndUpdate(
      req.params.id,
      { status: 'deleted' }
    );
    res.json({ message: 'Email deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/star', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    email.isStarred = !email.isStarred;
    await email.save();
    res.json(email);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/labels', async (req, res) => {
  try {
    const { labels } = req.body;
    const email = await Email.findByIdAndUpdate(
      req.params.id,
      { labels },
      { new: true }
    );
    res.json(email);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 