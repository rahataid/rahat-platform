import { check } from 'k6';
import http from 'k6/http';

// Main function for the load test
export default function () {
  // Example API request using the access token
  let accessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywidXNlcklkIjozLCJ1dWlkIjoiMmQyYzAyYjUtNDg2Zi00OTI5LThlNjgtNmFiZTFlYmMxMTA3IiwibmFtZSI6Ik1yIFVzZXIiLCJlbWFpbCI6InVzZXJAbWFpbGluYXRvci5jb20iLCJwaG9uZSI6bnVsbCwid2FsbGV0IjpudWxsLCJyb2xlcyI6WyJVc2VyIl0sInBlcm1pc3Npb25zIjpbeyJhY3Rpb24iOiJyZWFkIiwic3ViamVjdCI6InVzZXIiLCJpbnZlcnRlZCI6ZmFsc2UsImNvbmRpdGlvbnMiOm51bGx9XSwiaWF0IjoxNzI3MzQxNDYyLCJleHAiOjE3Mjc0Mjc4NjJ9.8eZ5igYKV_nQmK69d8VrJb5jdqL_k1S8TqteEr5NFGQ`;
  const res = http.get(
    `http://localhost:5500/v1/users?page=1&perPage=10&sort=createdAt&order=desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  check(res, { 'status was 200': (r) => r.status === 200 });
}

// Options for load testing
export const options = {
  vus: 100, // Number of virtual users
  duration: '10s', // Test duration
};
