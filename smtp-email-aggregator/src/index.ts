import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as winston from 'winston';

// Read Home Assistant add-on configuration
const options = JSON.parse(fs.readFileSync('/data/options.json', 'utf8'));

// Setup logger
const logger = winston.createLogger({
  level: options.log_level || 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/data/smtp_aggregator.log' })
  ]
});

// Outgoing email configuration
const outgoingConfig = {
  host: options.outgoing_host,
  port: options.outgoing_port,
  secure: options.outgoing_secure,
  auth: {
    user: options.outgoing_auth_user,
    pass: options.outgoing_auth_pass
  }
};

// Create a nodemailer transporter
const transporter = nodemailer.createTransport(outgoingConfig);

// Modify your server setup to use the configuration
const server = new SMTPServer({
  authOptional: true,
  onData(stream, session, callback) {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk;
    });
    stream.on('end', async () => {
      try {
        const parsed = await simpleParser(buffer);
        logger.info(`Received email from: ${parsed.from?.text}, subject: ${parsed.subject}`);
        
        // Here you would implement your email aggregation logic
        // For now, we'll just forward the email
        await transporter.sendMail({
          from: parsed.from?.text,
          to: parsed.to?.text,
          subject: parsed.subject,
          text: parsed.text,
          html: parsed.html
        });
        
        logger.info(`Forwarded email to: ${parsed.to?.text}`);
        callback();
      } catch (err) {
        logger.error('Error processing email:', err);
        callback(new Error('Error processing email'));
      }
    });
  }
});

// Start the server
server.listen(options.smtp_port || 25, () => {
  logger.info(`SMTP server is running on port ${options.smtp_port || 25}`);
});