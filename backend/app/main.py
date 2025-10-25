import os
import requests
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pathlib import Path
from typing import List
from pydantic import BaseModel, EmailStr

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL / SUPABASE_KEY are missing. Check your .env.")

# Connect to the database
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Connected to database!!!")
except Exception as e:
    print(e)


# Hardcoded user_id (replace with actual user ID)
global USER_ID

# Initialize FastAPI app
app = FastAPI(title="RMIT ONE - WEB")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4300", "http://localhost:4200"],
    allow_credentials=True, allow_methods=[""], allow_headers=[""],
)

@app.get("/")
async def home():
    return {"message": "Welcome to RMIT ONE - WEB"}
@app.post("/signup")
async def signup_user(name: str, email: str, api_token: str ,password : str):
    try:
        # Check if user already exists
        existing_user = supabase.table("User").select("user_id").eq("email", email).execute()

        if existing_user.data:
            raise HTTPException(status_code=400, detail="User with this email already exists")

        user_id = int(str(email.split('@')[0])[1:])
        # Insert new user
        new_user = {
            "user_id": user_id,
            "full_name": name,
            "email": email,
            "api_token": api_token,
            "password" : password
        }

        result = supabase.table("User").insert(new_user).execute()

        return {"message": "User created successfully", "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def signup_user(email: str ,password : str):
    global USER_ID
    try:
        # Check if user already exists
        existing_user = supabase.table("User").select("user_id").eq("email", email).execute()

        if not existing_user.data:
            raise HTTPException(status_code=400, detail="User does not exist!! Please register!!")

        # Check if user already exists
        existing_user = supabase.table("User").select("*").eq("email", email).eq("password", password).execute()

        if not existing_user.data:
            raise HTTPException(status_code=400, detail="Email or password is wrong!! Please try logging in again!!!")

        print(existing_user.data)
        # Get user id from User table
        USER_ID = supabase.table("User").select("user_id").eq("email", email).eq("password", password).execute().data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_user_details():
    try:
        result = supabase.table("User").select("api_token").eq("user_id", USER_ID).execute()

        if not result.data:
            raise Exception(f"No user found with id {USER_ID}")
        print(result)
        api_token = result.data[0]["api_token"]
        print("Token retrieved from Supabase:", api_token)
        return api_token

    except Exception as e:
        print("Error fetching token:", e)
        exit(1)

def get_courses():
    api_token = get_user_details()

    # Step 2: Use the token to call an API (example Canvas API endpoint)
    API_URL_COURSES = "https://rmit.instructure.com/api/v1/courses"  # Example
    result_email = ((supabase.table("User").select("email").eq("user_id", USER_ID).execute()).data)[0]
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Accept": "application/json"
    }

    try:
        response = requests.get(API_URL_COURSES, headers=headers)
        response.raise_for_status()
        courses = response.json()
        print("API data fetched successfully!")

        # Extract only the required fields
        filtered_courses = [
            {
                "course_id": c.get("id"),
                "course_name": c.get("name"),
                "course_code": c.get("course_code"),
                "created_at": c.get("created_at"),
                "start_at": c.get("start_at"),
                "end_at": c.get("end_at"),
                "user_id" : USER_ID,
                "email" : result_email,
                "apply_assignment_group_weights": c.get("apply_assignment_group_weights")
            }
            for c in courses
        ]

        print(filtered_courses)

        insert_result = supabase.table("Courses").insert(filtered_courses).execute()

        course_list = [c.get("id") for c in courses]
        get_assignments(course_list)
        if insert_result.data:
            print(f"Successfully inserted {len(insert_result.data)} course records into Supabase!")
        else:
            print("Insert executed but no data returned (check table or constraints).")
    except requests.exceptions.RequestException as e:
        print("Error calling API:", e)

    except Exception as e:
        print("Error inserting data into Supabase:", e)

def get_assignments(course_list):
    api_token = get_user_details()
    headers = {"Authorization": f"Bearer {api_token}", "Accept": "application/json"}
    for course_id in course_list:
        API_URL = f"https://rmit.instructure.com/api/v1/courses/{course_id}/assignments"
        try:
            response = requests.get(API_URL, headers=headers)
            response.raise_for_status()
            assignments = response.json()
            print(f"Assignments fetched successfully for course {course_id}")

            filtered_assignments = [
                {
                    "assignment_id": a.get("id"),
                    "course_id": course_id,
                    "assignment_name": a.get("name"),
                    "due_at": a.get("due_at"),
                    "created_at": a.get("created_at"),
                    "points_possible": a.get("points_possible"),
                    "submission_types": a.get("submission_types"),
                    "user_id": USER_ID
                }
                for a in assignments
            ]

            insert_result = supabase.table("Assignments").insert(filtered_assignments).execute()
            print(f"Inserted {len(insert_result.data)} assignments into Supabase!")

        except Exception as e:
            print("Error fetching/inserting assignments:", e)


@app.get("/users/{user_id}/courses")
def get_user_courses(user_id: int):
    """
    Fetch all courses for a given user_id and return only selected fields.
    """
    try:
        # Query Supabase
        response = supabase.table("Courses").select("*").eq("user_id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail=f"No courses found for user_id {user_id}")

        # Filter and rename fields for response
        filtered_courses = [
            {
                "id": course.get("course_id"),
                "name": course.get("course_name"),
                "course_code": course.get("course_code"),
                "created_at": course.get("created_at"),
                "start_at": course.get("start_at"),
                "end_at": course.get("end_at"),
                "apply_assignment_group_weights": course.get("apply_assignment_group_weights")
            }
            for course in response.data
        ]

        return filtered_courses

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
class ClassmateRequest(BaseModel):
    is_theory: bool
    course_id: int
    day_of_course: str
    time_of_day: str
    room_of_course: str
    user_id: int

@app.post("/find_classmate")
async def find_classmate(requests: List[ClassmateRequest]):
    try:
        course_match_json = []  # initialize before the loop

        print(supabase)
        for req in requests:
            existing_course = (
                supabase.table("Courses")
                .select("course_id", "user_id","course_name").eq("user_id", req.user_id).eq("course_id", req.course_id)
                .execute()
            )
            print(existing_course)
            if not existing_course.data:
                raise HTTPException(status_code=400, detail="Course Does not exist please check the course_id or user_id")
            
            user_id = req.user_id
            new_course_timetable = {
                "user_id": req.user_id,
                "course_id": req.course_id,
                "day_of_course": req.day_of_course,
                "time_of_day": req.time_of_day,
                "room_of_course": req.room_of_course,
                "course_name": existing_course.data[0]["course_name"],
                "is_theory": req.is_theory
            }
        
            try:
                existing_in_table = (
                supabase.table("Course_timetable")
                .select("course_id", "user_id").eq("user_id", req.user_id).eq("course_id", req.course_id)
                .execute()
                )
                print(existing_in_table.data)
                if not existing_in_table.data:
                    result = supabase.table("Course_timetable").insert(new_course_timetable).execute()
                    print("Inserted data to table Course timetable", result.data)
                print("Data is in table")
            except Exception as e:
                print("Error inserting data to the table: ",e)
        
        
        ### GET SAME PEOPLE FROM COURSE ###
        # First get the courses for this user id #

        result_get_user_course = supabase.table("Course_timetable").select("course_id","day_of_course","time_of_day","room_of_course","course_name","is_theory")\
        .eq("user_id", user_id).execute()

        if not result_get_user_course.data:
            raise HTTPException(status_code=400, detail="User doesnt exist in course timetable table!! Please insert")
        
        for res in result_get_user_course.data:
            course_id = res['course_id']
            day_of_course=res['day_of_course']
            time_of_day=res['time_of_day']
            room_of_course=res['room_of_course']
            is_theory=res['is_theory']

            result_same_time = supabase.table("Course_timetable").select("course_id","user_id","day_of_course","time_of_day","room_of_course","course_name","is_theory")\
            .eq("course_id", course_id).eq("day_of_course", day_of_course).eq("time_of_day", time_of_day).eq("room_of_course", room_of_course)\
                .eq("is_theory", is_theory).neq("user_id", user_id).execute()

             # If classmates exist, append them to JSON list
            if result_same_time.data:
                for classmate in result_same_time.data:
                    course_match_json.append({
                        "user_id": classmate["user_id"],
                        "course_id": classmate["course_id"],
                        "day": classmate["day_of_course"],
                        "time": classmate["time_of_day"],
                        "room": classmate["room_of_course"],
                        "course_name": classmate["course_name"],
                        "is_theory": classmate["is_theory"]
                })
            else:
                print("No classmates for course!!!")
        if len(course_match_json) > 0:
            return {"message": "Classmates found successfully","count": len(course_match_json),"data": course_match_json}
        else:
            return {"message": "No classmates found for all courses","count": len(course_match_json),"data": course_match_json}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))