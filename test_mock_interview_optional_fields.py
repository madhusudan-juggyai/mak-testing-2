import requests
import json
import unittest
import os
from dotenv import load_dotenv

# Load environment variables from frontend/.env
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api"
print(f"Using backend URL: {BACKEND_URL}")

class MockInterviewOptionalFieldsTest(unittest.TestCase):
    """Test suite for testing optional fields in the MockInterviewRequest endpoint"""
    
    def test_01_all_fields_filled(self):
        """Test with all fields filled (should work as before)"""
        test_data = {
            "current_role": "Product Manager",
            "current_company": "Tech Corp",
            "pm_experience": 3,
            "total_experience": 5,
            "target_role": "Senior Product Manager",
            "target_company": "Google",
            "job_description": "Looking for a senior PM to lead mobile initiatives..."
        }
        
        response = requests.post(
            f"{BACKEND_URL}/generate-mock-interview-prompt",
            json=test_data
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prompt", data)
        prompt = data["prompt"]
        
        # Verify the prompt contains all the provided information
        self.assertIn("Current Role: Product Manager", prompt)
        self.assertIn("Current Company: Tech Corp", prompt)
        self.assertIn("Product Management Experience: 3 years", prompt)
        self.assertIn("Total Work Experience: 5 years", prompt)
        self.assertIn("Position: Senior Product Manager", prompt)
        self.assertIn("Company: Google", prompt)
        self.assertIn("JOB DESCRIPTION", prompt)
        self.assertIn("Looking for a senior PM to lead mobile initiatives", prompt)
        
        print("✅ Test with all fields filled passed")
    
    def test_02_optional_fields_empty(self):
        """Test with optional fields empty (new functionality)"""
        test_data = {
            "current_role": "Product Manager",
            "current_company": "Tech Corp",
            "pm_experience": 3,
            "total_experience": 5,
            "target_role": "",
            "target_company": "",
            "job_description": ""
        }
        
        response = requests.post(
            f"{BACKEND_URL}/generate-mock-interview-prompt",
            json=test_data
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prompt", data)
        prompt = data["prompt"]
        
        # Verify the prompt contains the required information
        self.assertIn("Current Role: Product Manager", prompt)
        self.assertIn("Current Company: Tech Corp", prompt)
        self.assertIn("Product Management Experience: 3 years", prompt)
        self.assertIn("Total Work Experience: 5 years", prompt)
        
        # Verify the prompt does not contain empty optional fields
        self.assertNotIn("TARGET ROLE:\n- Position:", prompt)
        self.assertNotIn("TARGET ROLE:\n- Company:", prompt)
        self.assertNotIn("JOB DESCRIPTION:\n", prompt)
        
        print("✅ Test with optional fields empty passed")
    
    def test_03_missing_optional_fields(self):
        """Test with missing optional fields completely"""
        test_data = {
            "current_role": "Product Manager",
            "current_company": "Tech Corp",
            "pm_experience": 3,
            "total_experience": 5
        }
        
        response = requests.post(
            f"{BACKEND_URL}/generate-mock-interview-prompt",
            json=test_data
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prompt", data)
        prompt = data["prompt"]
        
        # Verify the prompt contains the required information
        self.assertIn("Current Role: Product Manager", prompt)
        self.assertIn("Current Company: Tech Corp", prompt)
        self.assertIn("Product Management Experience: 3 years", prompt)
        self.assertIn("Total Work Experience: 5 years", prompt)
        
        # Verify the prompt does not contain the missing optional fields sections
        self.assertNotIn("TARGET ROLE:", prompt)
        self.assertNotIn("JOB DESCRIPTION:", prompt)
        
        print("✅ Test with missing optional fields passed")
    
    def test_04_only_target_role(self):
        """Test with only target role provided"""
        test_data = {
            "current_role": "Product Manager",
            "current_company": "Tech Corp",
            "pm_experience": 3,
            "total_experience": 5,
            "target_role": "Senior Product Manager",
            "target_company": "",
            "job_description": ""
        }
        
        response = requests.post(
            f"{BACKEND_URL}/generate-mock-interview-prompt",
            json=test_data
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prompt", data)
        prompt = data["prompt"]
        
        # Verify the prompt contains the required and provided optional information
        self.assertIn("Current Role: Product Manager", prompt)
        self.assertIn("Current Company: Tech Corp", prompt)
        self.assertIn("Product Management Experience: 3 years", prompt)
        self.assertIn("Total Work Experience: 5 years", prompt)
        self.assertIn("TARGET ROLE:", prompt)
        self.assertIn("Position: Senior Product Manager", prompt)
        
        # Verify the prompt does not contain empty optional fields
        self.assertNotIn("- Company:", prompt)
        self.assertNotIn("JOB DESCRIPTION:", prompt)
        
        print("✅ Test with only target role passed")
    
    def test_05_only_target_company(self):
        """Test with only target company provided"""
        test_data = {
            "current_role": "Product Manager",
            "current_company": "Tech Corp",
            "pm_experience": 3,
            "total_experience": 5,
            "target_role": "",
            "target_company": "Google",
            "job_description": ""
        }
        
        response = requests.post(
            f"{BACKEND_URL}/generate-mock-interview-prompt",
            json=test_data
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prompt", data)
        prompt = data["prompt"]
        
        # Verify the prompt contains the required and provided optional information
        self.assertIn("Current Role: Product Manager", prompt)
        self.assertIn("Current Company: Tech Corp", prompt)
        self.assertIn("Product Management Experience: 3 years", prompt)
        self.assertIn("Total Work Experience: 5 years", prompt)
        self.assertIn("TARGET ROLE:", prompt)
        self.assertIn("Company: Google", prompt)
        
        # Verify the prompt does not contain empty optional fields
        self.assertNotIn("Position:", prompt)
        self.assertNotIn("JOB DESCRIPTION:", prompt)
        
        print("✅ Test with only target company passed")
    
    def test_06_only_job_description(self):
        """Test with only job description provided"""
        test_data = {
            "current_role": "Product Manager",
            "current_company": "Tech Corp",
            "pm_experience": 3,
            "total_experience": 5,
            "target_role": "",
            "target_company": "",
            "job_description": "Looking for a senior PM to lead mobile initiatives..."
        }
        
        response = requests.post(
            f"{BACKEND_URL}/generate-mock-interview-prompt",
            json=test_data
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prompt", data)
        prompt = data["prompt"]
        
        # Verify the prompt contains the required and provided optional information
        self.assertIn("Current Role: Product Manager", prompt)
        self.assertIn("Current Company: Tech Corp", prompt)
        self.assertIn("Product Management Experience: 3 years", prompt)
        self.assertIn("Total Work Experience: 5 years", prompt)
        self.assertIn("JOB DESCRIPTION:", prompt)
        self.assertIn("Looking for a senior PM to lead mobile initiatives", prompt)
        
        # Verify the prompt does not contain empty optional fields
        self.assertNotIn("TARGET ROLE:", prompt)
        
        print("✅ Test with only job description passed")
    
    def test_07_authentication_required(self):
        """Test that the endpoint requires authentication"""
        # This endpoint doesn't actually require authentication, so we'll skip this test
        # In a real application, you might want to add authentication to this endpoint
        print("ℹ️ Authentication not required for this endpoint - skipping test")
        pass

if __name__ == "__main__":
    # Run the tests
    print(f"Testing MockInterviewRequest endpoint with optional fields at: {BACKEND_URL}")
    print("=" * 80)
    unittest.main(verbosity=2)