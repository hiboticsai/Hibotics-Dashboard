"""
Test suite for HiBotics AI Onboarding API endpoints
Tests: Discovery questions, Voices, Submission flow, Admin management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@hibotics.ai"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = f"TEST_onboarding_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "testpass123"


class TestOnboardingPublicEndpoints:
    """Test public onboarding endpoints (no auth required)"""
    
    def test_get_discovery_questions(self):
        """GET /api/onboarding/discovery-questions returns 5 discovery questions"""
        response = requests.get(f"{BASE_URL}/api/onboarding/discovery-questions")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 5, f"Expected 5 questions, got {len(data)}"
        
        # Validate question structure
        for q in data:
            assert "key" in q, "Question should have 'key'"
            assert "question" in q, "Question should have 'question'"
            assert "type" in q, "Question should have 'type'"
            assert q["type"] in ["select", "textarea"], f"Invalid question type: {q['type']}"
        
        print(f"✓ Discovery questions endpoint returns {len(data)} questions")
    
    def test_get_voices(self):
        """GET /api/onboarding/voices returns list of voice options with preview URLs"""
        response = requests.get(f"{BASE_URL}/api/onboarding/voices")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should return at least one voice"
        
        # Validate voice structure
        for voice in data:
            assert "voice_id" in voice, "Voice should have 'voice_id'"
            assert "name" in voice, "Voice should have 'name'"
            assert "preview_url" in voice, "Voice should have 'preview_url'"
            # Preview URL should be a valid URL
            if voice["preview_url"]:
                assert voice["preview_url"].startswith("http"), f"Invalid preview URL: {voice['preview_url']}"
        
        print(f"✓ Voices endpoint returns {len(data)} voices with preview URLs")
        return data


class TestOnboardingSubmission:
    """Test onboarding submission flow"""
    
    @pytest.fixture
    def voices(self):
        """Get available voices for testing"""
        response = requests.get(f"{BASE_URL}/api/onboarding/voices")
        return response.json()
    
    @pytest.fixture
    def discovery_questions(self):
        """Get discovery questions for testing"""
        response = requests.get(f"{BASE_URL}/api/onboarding/discovery-questions")
        return response.json()
    
    def test_submit_onboarding_new_user(self, voices, discovery_questions):
        """POST /api/onboarding/submit creates new user and submission for unauthenticated users"""
        # Build discovery answers
        discovery_answers = []
        for q in discovery_questions:
            if q["type"] == "select" and "options" in q:
                answer = q["options"][0]  # Pick first option
            else:
                answer = "Test answer for " + q["key"]
            discovery_answers.append({
                "question_key": q["key"],
                "answer": answer
            })
        
        # Select first voice
        selected_voice = voices[0]
        
        payload = {
            "name": "Test User",
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "business_name": "TEST_Business_" + uuid.uuid4().hex[:8],
            "industry": "healthcare",
            "business_size": "2-5",
            "website_url": "https://testbusiness.com",
            "facebook_url": None,
            "instagram_url": None,
            "linkedin_url": None,
            "discovery_answers": discovery_answers,
            "business_hours": "Mon-Fri 9am-5pm",
            "call_handling_instructions": "Please be professional",
            "services_offered": "Consulting services",
            "booking_link": "https://calendly.com/test",
            "selected_voice": {
                "voice_id": selected_voice["voice_id"],
                "voice_name": selected_voice["name"],
                "preview_url": selected_voice.get("preview_url")
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/submit",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "submission_id" in data, "Response should have submission_id"
        assert "message" in data, "Response should have message"
        assert "access_token" in data, "Response should have access_token for new users"
        assert data["access_token"] is not None, "access_token should not be None for new users"
        
        print(f"✓ New user onboarding submission created: {data['submission_id']}")
        return data
    
    def test_submit_onboarding_authenticated_user(self, voices, discovery_questions):
        """POST /api/onboarding/submit works for authenticated users without creating new account"""
        # First login as admin
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json()["access_token"]
        
        # Build discovery answers
        discovery_answers = []
        for q in discovery_questions:
            if q["type"] == "select" and "options" in q:
                answer = q["options"][0]
            else:
                answer = "Test answer for " + q["key"]
            discovery_answers.append({
                "question_key": q["key"],
                "answer": answer
            })
        
        selected_voice = voices[0]
        
        payload = {
            "business_name": "TEST_AuthBusiness_" + uuid.uuid4().hex[:8],
            "industry": "technology",
            "business_size": "6-10",
            "website_url": "https://authbusiness.com",
            "discovery_answers": discovery_answers,
            "business_hours": "24/7",
            "call_handling_instructions": "Handle all calls professionally",
            "services_offered": "Tech support",
            "booking_link": None,
            "selected_voice": {
                "voice_id": selected_voice["voice_id"],
                "voice_name": selected_voice["name"],
                "preview_url": selected_voice.get("preview_url")
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/submit",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "submission_id" in data, "Response should have submission_id"
        # For authenticated users, access_token should be None
        assert data.get("access_token") is None, "access_token should be None for authenticated users"
        
        print(f"✓ Authenticated user onboarding submission created: {data['submission_id']}")
        return data


class TestOnboardingAdminEndpoints:
    """Test admin onboarding management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_get_submissions_list(self, admin_token):
        """GET /api/onboarding/submissions (admin) returns list of submissions"""
        response = requests.get(
            f"{BASE_URL}/api/onboarding/submissions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # If there are submissions, validate structure
        if len(data) > 0:
            submission = data[0]
            assert "submission_id" in submission
            assert "business_name" in submission
            assert "email" in submission
            assert "status" in submission
            assert "created_at" in submission
        
        print(f"✓ Admin submissions list returns {len(data)} submissions")
        return data
    
    def test_get_submission_detail(self, admin_token):
        """GET /api/onboarding/submissions/{id} (admin) returns submission details with discovery answers"""
        # First get list of submissions
        list_response = requests.get(
            f"{BASE_URL}/api/onboarding/submissions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        submissions = list_response.json()
        
        if len(submissions) == 0:
            pytest.skip("No submissions to test detail view")
        
        submission_id = submissions[0]["submission_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/onboarding/submissions/{submission_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "submission_id" in data
        assert "business_name" in data
        assert "discovery_answers" in data, "Should include discovery_answers"
        assert "discovery_questions" in data, "Should include discovery_questions"
        
        print(f"✓ Admin submission detail returns full data with discovery answers")
        return data
    
    def test_update_submission_status(self, admin_token):
        """PUT /api/onboarding/submissions/{id} (admin) updates submission status"""
        # Get a submission to update
        list_response = requests.get(
            f"{BASE_URL}/api/onboarding/submissions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        submissions = list_response.json()
        
        if len(submissions) == 0:
            pytest.skip("No submissions to test update")
        
        submission_id = submissions[0]["submission_id"]
        
        # Update status to 'reviewed'
        response = requests.put(
            f"{BASE_URL}/api/onboarding/submissions/{submission_id}",
            json={"status": "reviewed"},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {admin_token}"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["status"] == "reviewed", f"Status should be 'reviewed', got {data['status']}"
        assert "reviewed_by" in data, "Should have reviewed_by field"
        assert "reviewed_at" in data, "Should have reviewed_at field"
        
        print(f"✓ Admin can update submission status")
        return data
    
    def test_add_admin_note(self, admin_token):
        """POST /api/onboarding/submissions/{id}/notes (admin) adds admin notes"""
        # Get a submission
        list_response = requests.get(
            f"{BASE_URL}/api/onboarding/submissions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        submissions = list_response.json()
        
        if len(submissions) == 0:
            pytest.skip("No submissions to test notes")
        
        submission_id = submissions[0]["submission_id"]
        
        # Add a note
        note_text = f"Test note added at {uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/onboarding/submissions/{submission_id}/notes",
            json={"note": note_text},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {admin_token}"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "admin_notes" in data, "Response should have admin_notes"
        assert note_text in data["admin_notes"], "Note should be in admin_notes"
        
        print(f"✓ Admin can add notes to submission")
        return data
    
    def test_get_onboarding_stats(self, admin_token):
        """GET /api/onboarding/stats (admin) returns submission statistics"""
        response = requests.get(
            f"{BASE_URL}/api/onboarding/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total" in data, "Stats should have 'total'"
        assert "pending" in data, "Stats should have 'pending'"
        assert "reviewed" in data, "Stats should have 'reviewed'"
        assert "setup_complete" in data, "Stats should have 'setup_complete'"
        assert "rejected" in data, "Stats should have 'rejected'"
        
        # Validate types
        assert isinstance(data["total"], int)
        assert isinstance(data["pending"], int)
        
        print(f"✓ Admin stats endpoint returns: total={data['total']}, pending={data['pending']}")
        return data
    
    def test_submissions_require_admin(self):
        """Verify admin endpoints require admin authentication"""
        # Try without auth
        response = requests.get(f"{BASE_URL}/api/onboarding/submissions")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        
        # Try with non-admin user (if we have one)
        # For now just verify 401 without token
        print("✓ Admin endpoints properly require authentication")


class TestOnboardingValidation:
    """Test validation and error handling"""
    
    def test_submit_without_required_fields(self):
        """Submission should fail without required fields"""
        payload = {
            "business_name": "Test Business"
            # Missing other required fields
        }
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/submit",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should fail validation
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("✓ Validation rejects incomplete submissions")
    
    def test_submit_with_invalid_email(self):
        """Submission should fail with invalid email"""
        payload = {
            "name": "Test",
            "email": "not-an-email",
            "password": "test123",
            "business_name": "Test Business",
            "industry": "healthcare",
            "business_size": "2-5",
            "discovery_answers": [],
            "selected_voice": {
                "voice_id": "test",
                "voice_name": "Test Voice"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/submit",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("✓ Validation rejects invalid email")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
