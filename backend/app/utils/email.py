import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_email(to_email: str, subject: str, html_content: str):
    """Core utility to send an email via SMTP."""
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print(f"[MOCK EMAIL] To: {to_email} | Subject: {subject}")
        print("Set SMTP_USERNAME and SMTP_PASSWORD in .env to send real emails.")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_USERNAME
    msg["To"] = to_email

    part1 = MIMEText(html_content, "html")
    msg.attach(part1)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, to_email, msg.as_string())
        print(f"Successfully sent email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def send_employee_invite_email(to_email: str, temp_password: str, org_name: str):
    """Sent when an Organization creates a new Employee account."""
    subject = f"Welcome to TeamForge - You've been invited by {org_name}"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #6d28d9;">Welcome to TeamForge!</h2>
        <p><strong>{org_name}</strong> has invited you to join their workspace.</p>
        <p>Your temporary credentials are:</p>
        <ul>
          <li><strong>Email:</strong> {to_email}</li>
          <li><strong>Temporary Password:</strong> {temp_password}</li>
        </ul>
        <p>Please log in to complete your setup by uploading your resume and creating a secure password.</p>
        <br>
        <a href="http://localhost:5173/auth" style="display: inline-block; padding: 10px 20px; background-color: #6d28d9; color: #fff; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
      </body>
    </html>
    """
    send_email(to_email, subject, html)

def send_allocation_notification(to_email: str, project_id: int, role: str, description: str):
    """Sent when an Organization approves an allocation, finalizing an Employee's new task."""
    subject = f"New Assignment: You've been allocated to Project #{project_id}"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #059669;">New Project Assignment</h2>
        <p>You have been assigned to a new role on <strong>Project #{project_id}</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #111827;">Role: {role}</h3>
          <p style="margin-bottom: 0;">{description}</p>
        </div>
        <p>Log in to your dashboard to review your active workloads and coordinate with your team.</p>
        <br>
        <a href="http://localhost:5173/employee-dashboard" style="display: inline-block; padding: 10px 20px; background-color: #059669; color: #fff; text-decoration: none; border-radius: 5px;">View My Tasks</a>
      </body>
    </html>
    """
    send_email(to_email, subject, html)
