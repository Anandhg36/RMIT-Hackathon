import requests
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import psycopg2
from dotenv import load_dotenv
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr

# # Load environment variables from .env
# load_dotenv("database_key.env")

#
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")
#
# # Connect to the database
# try:
#     supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
#     print
# except Exception as e:
#     print(e)
#
# # Hardcoded user_id (replace with actual user ID)
# USER_ID = 4190959
#
# # Initialize FastAPI app
# app = FastAPI(title="RMIT ONE - WEB")
#
#
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:4300", "http://localhost:4200"],
#     allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
# )
#
# @app.post("/signup")
# async def signup_user(name: str, email: str, api_token: str ,password : str):
#     try:
#         # Check if user already exists
#         existing_user = supabase.table("User").select("user_id").eq("email", email).execute()
#
#         if existing_user.data:
#             raise HTTPException(status_code=400, detail="User with this email already exists")
#
#         user_id = int(str(email.split('@')[0])[1:])
#         # Insert new user
#         new_user = {
#             "user_id": user_id,
#             "full_name": name,
#             "email": email,
#             "api_token": api_token,
#             "password" : password
#         }
#
#         result = supabase.table("User").insert(new_user).execute()
#
#         return {"message": "User created successfully", "data": result.data}
#
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#
# @app.post("/login")
# async def signup_user(email: str ,password : str):
#     try:
#         # Check if user already exists
#         existing_user = supabase.table("User").select("user_id").eq("email", email).execute()
#
#         if not existing_user.data:
#             raise HTTPException(status_code=400, detail="User does not exist!! Please register!!")
#
#         # Check if user already exists
#         existing_user = supabase.table("User").select("*").eq("email", email).eq("password", password).execute()
#
#         if not existing_user.data:
#             raise HTTPException(status_code=400, detail="Email or password is wrong!! Please try logging in again!!!")
#
#         print(existing_user.data)
#
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#
# def get_user_details():
#     try:
#         result = supabase.table("User").select("api_token").eq("user_id", USER_ID).execute()
#
#         if not result.data:
#             raise Exception(f"No user found with id {USER_ID}")
#         print(result)
#         api_token = result.data[0]["api_token"]
#         print("Token retrieved from Supabase:", api_token)
#         return api_token
#
#     except Exception as e:
#         print("Error fetching token:", e)
#         exit(1)
#
# def get_courses():
#     api_token = get_user_details()
#
#     # Step 2: Use the token to call an API (example Canvas API endpoint)
#     API_URL_COURSES = "https://rmit.instructure.com/api/v1/courses"  # Example
#     result_email = ((supabase.table("User").select("email").eq("user_id", USER_ID).execute()).data)[0]
#     headers = {
#         "Authorization": f"Bearer {api_token}",
#         "Accept": "application/json"
#     }
#
#     try:
#         response = requests.get(API_URL_COURSES, headers=headers)
#         response.raise_for_status()
#         courses = response.json()
#         print("API data fetched successfully!")
#
#         # Extract only the required fields
#         filtered_courses = [
#             {
#                 "course_id": c.get("id"),
#                 "course_name": c.get("name"),
#                 "course_code": c.get("course_code"),
#                 "created_at": c.get("created_at"),
#                 "start_at": c.get("start_at"),
#                 "end_at": c.get("end_at"),
#                 "user_id" : USER_ID,
#                 "email" : result_email,
#                 "apply_assignment_group_weights": c.get("apply_assignment_group_weights")
#             }
#             for c in courses
#         ]
#
#         print(filtered_courses)
#
#         insert_result = supabase.table("Courses").insert(filtered_courses).execute()
#
#         if insert_result.data:
#             print(f"Successfully inserted {len(insert_result.data)} course records into Supabase!")
#         else:
#             print("Insert executed but no data returned (check table or constraints).")
#
#     except requests.exceptions.RequestException as e:
#         print("Error calling API:", e)
#
#     except Exception as e:
#         print("Error inserting data into Supabase:", e)
#
#
# @app.get("/users/{user_id}/courses/find_classmate")
# def get_user_courses(user_id: int):
#     """
#     Fetch all courses for a given user_id and return only selected fields.
#     """
#     try:
#         # Query Supabase
#         response = supabase.table("Courses").select("*").eq("user_id", user_id).execute()
#
#         if not response.data:
#             raise HTTPException(status_code=404, detail=f"No courses found for user_id {user_id}")
#
#         # Filter and rename fields for response
#         filtered_courses = [
#             {
#                 "id": course.get("course_id"),
#                 "name": course.get("course_name"),
#                 "course_code": course.get("course_code"),
#                 "created_at": course.get("created_at"),
#                 "start_at": course.get("start_at"),
#                 "end_at": course.get("end_at"),
#                 "apply_assignment_group_weights": course.get("apply_assignment_group_weights")
#             }
#             for course in response.data
#         ]
#
#         return filtered_courses
#
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
