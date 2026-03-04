#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional

class HiBoticsAPITester:
    def __init__(self, base_url="https://hibotics-analytics.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "passed": success,
            "details": details
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, {}, 0

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            return success, response_data, response.status_code

        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_health_check(self):
        """Test basic API health"""
        success, data, status = self.make_request('GET', 'health')
        self.log_test("API Health Check", success and status == 200, 
                     f"Status: {status}" if not success else "")

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        credentials = {
            "email": "admin@hibotics.ai",
            "password": "admin123"
        }
        
        success, data, status = self.make_request('POST', 'auth/login', credentials)
        
        if success and 'access_token' in data:
            self.token = data['access_token']
            self.admin_user = data.get('user', {})
            self.log_test("Admin Login", True)
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {status}, Data: {data}")
            return False

    def test_admin_access(self):
        """Test admin-only endpoints"""
        if not self.token:
            self.log_test("Admin Access Test", False, "No admin token available")
            return

        # Test admin stats
        success, data, status = self.make_request('GET', 'admin/stats')
        self.log_test("Admin Stats Access", success, f"Status: {status}" if not success else "")

        # Test companies list
        success, data, status = self.make_request('GET', 'companies')
        self.log_test("Companies List Access", success, f"Status: {status}" if not success else "")
        
        return success

    def test_database_seeding(self):
        """Test database seeding functionality"""
        if not self.token:
            self.log_test("Database Seeding", False, "No admin token available")
            return False

        success, data, status = self.make_request('POST', 'seed')
        
        # Seeding can return success even if already seeded
        if success and (data.get('seeded') or 'already has data' in data.get('message', '')):
            self.log_test("Database Seeding", True)
            return True
        else:
            self.log_test("Database Seeding", False, f"Status: {status}, Data: {data}")
            return False

    def test_companies_endpoints(self):
        """Test company-related endpoints"""
        if not self.token:
            self.log_test("Companies Endpoints", False, "No admin token available")
            return

        # List companies
        success, companies_data, status = self.make_request('GET', 'companies')
        if not success:
            self.log_test("List Companies", False, f"Status: {status}")
            return

        self.log_test("List Companies", True)
        
        # Check for seeded companies
        companies = companies_data if isinstance(companies_data, list) else []
        inlux_found = any(c.get('slug') == 'inlux' for c in companies)
        ayurvilla_found = any(c.get('slug') == 'ayurvilla' for c in companies)
        
        self.log_test("Inlux Company Seeded", inlux_found)
        self.log_test("Ayur Villa Company Seeded", ayurvilla_found)

        # Test get company by slug
        if inlux_found:
            success, data, status = self.make_request('GET', 'companies/slug/inlux')
            self.log_test("Get Company by Slug (inlux)", success)

        if ayurvilla_found:
            success, data, status = self.make_request('GET', 'companies/slug/ayurvilla')
            self.log_test("Get Company by Slug (ayurvilla)", success)

    def test_dashboard_kpis(self):
        """Test dashboard KPI endpoints"""
        if not self.token:
            self.log_test("Dashboard KPIs", False, "No admin token available")
            return

        # Test admin dashboard KPIs
        success, data, status = self.make_request('GET', 'dashboard/kpis')
        self.log_test("Admin Dashboard KPIs", success, f"Status: {status}" if not success else "")

        # Test call trends
        success, data, status = self.make_request('GET', 'dashboard/call-trends?days=30')
        self.log_test("Call Trends API", success, f"Status: {status}" if not success else "")

        # Test outcome distribution
        success, data, status = self.make_request('GET', 'dashboard/outcome-distribution')
        self.log_test("Outcome Distribution API", success, f"Status: {status}" if not success else "")

    def test_calls_endpoints(self):
        """Test calls-related endpoints"""
        if not self.token:
            self.log_test("Calls Endpoints", False, "No admin token available")
            return

        # List calls
        success, data, status = self.make_request('GET', 'calls')
        self.log_test("List Calls", success, f"Status: {status}" if not success else "")

        # Test with filters
        success, data, status = self.make_request('GET', 'calls?outcome=booking')
        self.log_test("Filter Calls by Outcome", success, f"Status: {status}" if not success else "")

    def test_leads_endpoints(self):
        """Test leads-related endpoints"""
        if not self.token:
            self.log_test("Leads Endpoints", False, "No admin token available")
            return

        # List leads
        success, data, status = self.make_request('GET', 'leads')
        self.log_test("List Leads", success, f"Status: {status}" if not success else "")

        # Test with filters
        success, data, status = self.make_request('GET', 'leads?status=new')
        self.log_test("Filter Leads by Status", success, f"Status: {status}" if not success else "")

    def test_social_endpoints(self):
        """Test social media related endpoints"""
        if not self.token:
            self.log_test("Social Endpoints", False, "No admin token available")
            return

        # List social accounts
        success, data, status = self.make_request('GET', 'social-accounts')
        self.log_test("List Social Accounts", success, f"Status: {status}" if not success else "")

        # List social metrics
        success, data, status = self.make_request('GET', 'social-metrics')
        self.log_test("List Social Metrics", success, f"Status: {status}" if not success else "")

    def test_billing_endpoints(self):
        """Test billing-related endpoints"""
        if not self.token:
            self.log_test("Billing Endpoints", False, "No admin token available")
            return

        # List billing records
        success, data, status = self.make_request('GET', 'billing')
        self.log_test("List Billing Records", success, f"Status: {status}" if not success else "")

        # Test with filters
        success, data, status = self.make_request('GET', 'billing?payment_status=paid')
        self.log_test("Filter Billing by Status", success, f"Status: {status}" if not success else "")

    def test_users_endpoints(self):
        """Test user management endpoints"""
        if not self.token:
            self.log_test("Users Endpoints", False, "No admin token available")
            return

        # List users
        success, data, status = self.make_request('GET', 'users')
        self.log_test("List Users", success, f"Status: {status}" if not success else "")

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        if not self.token:
            self.log_test("Auth Me Endpoint", False, "No admin token available")
            return

        success, data, status = self.make_request('GET', 'auth/me')
        self.log_test("Auth Me Endpoint", success, f"Status: {status}" if not success else "")

    def test_reports_endpoint(self):
        """Test PDF report generation"""
        if not self.token:
            self.log_test("PDF Reports", False, "No admin token available")
            return

        success, data, status = self.make_request('GET', 'reports/generate-pdf?report_type=weekly')
        # PDF endpoint might return different content-type
        self.log_test("PDF Report Generation", success or status == 200, 
                     f"Status: {status}" if not (success or status == 200) else "")

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting HiBotics AI API Testing...")
        print("=" * 60)

        # Health check first
        self.test_health_check()

        # Authentication
        if not self.test_admin_login():
            print("❌ Cannot proceed without admin authentication")
            return self.get_summary()

        # Admin access
        self.test_admin_access()
        
        # Auth me
        self.test_auth_me()

        # Database seeding (creates test data)
        self.test_database_seeding()

        # Core endpoints
        self.test_companies_endpoints()
        self.test_dashboard_kpis()
        self.test_calls_endpoints()
        self.test_leads_endpoints()
        self.test_social_endpoints()
        self.test_billing_endpoints()
        self.test_users_endpoints()
        self.test_reports_endpoint()

        return self.get_summary()

    def get_summary(self):
        """Get test summary"""
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        summary = {
            "total_tests": self.tests_run,
            "passed": self.tests_passed,
            "failed": self.tests_run - self.tests_passed,
            "success_rate": round(success_rate, 1),
            "test_results": self.test_results
        }
        
        print("=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed ({success_rate:.1f}%)")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["passed"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return summary

def main():
    """Main test runner"""
    tester = HiBoticsAPITester()
    
    try:
        summary = tester.run_all_tests()
        
        # Return appropriate exit code
        if summary["success_rate"] == 100:
            print("\n🎉 All tests passed!")
            return 0
        elif summary["success_rate"] >= 80:
            print(f"\n⚠️  Most tests passed ({summary['success_rate']}%)")
            return 0
        else:
            print(f"\n💥 Many tests failed ({summary['success_rate']}%)")
            return 1
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Test runner crashed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())