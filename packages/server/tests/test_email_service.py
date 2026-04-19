import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.config.config import OTP_EXPIRY_MINUTES
from src.services.email_service import render_password_reset_email, render_verification_email


class EmailServiceRenderTests(unittest.TestCase):
    def test_verification_email_contains_branded_html_and_text(self):
        rendered = render_verification_email("Ada <Builder>", "481920")

        self.assertIn("Verify your RepoSphere account", rendered.html)
        self.assertIn("RepoSphere", rendered.html)
        self.assertIn("Verification code", rendered.html)
        self.assertIn("481920", rendered.html)
        self.assertIn("Ada &lt;Builder&gt;", rendered.html)
        self.assertIn(f"This code expires in {OTP_EXPIRY_MINUTES} minutes.", rendered.html)

        self.assertIn("RepoSphere - Verify your RepoSphere account", rendered.text)
        self.assertIn("Verification code: 481920", rendered.text)
        self.assertIn("Hi Ada <Builder>,", rendered.text)

    def test_password_reset_email_contains_reset_specific_copy(self):
        rendered = render_password_reset_email("", "902114")

        self.assertIn("Reset your RepoSphere password", rendered.html)
        self.assertIn("Reset code", rendered.html)
        self.assertIn("902114", rendered.html)
        self.assertIn("If you did not request a password reset", rendered.html)
        self.assertIn("Hi there,", rendered.text)
        self.assertIn("Reset code: 902114", rendered.text)

    def test_rendered_email_keeps_mobile_safe_container_structure(self):
        rendered = render_verification_email("Long Name Example", "123456")

        self.assertIn("max-width:640px", rendered.html)
        self.assertIn("border-radius:28px", rendered.html)
        self.assertIn("This message was sent by RepoSphere", rendered.text)


if __name__ == "__main__":
    unittest.main()
