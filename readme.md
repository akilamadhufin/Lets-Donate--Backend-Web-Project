# Let's Donate

## Overview
**Let's Donate** is a web application which is designed to help people to donate their unwanted but usable items, such as electronics, kitchenware, gardening tools, or sports equipment to other people those who need them. Users can register, list donation items by category, track the status of their donations, and update, delete their items. Once an user submit an item, then admins review and approve/reject items to ensure quality.

The goal is to make item donation easy, organized, and accessible for everyone. The system also includes email confirmations, search and filter functionality, and an admin panel for management.

## Features
- **User Authentication** - Adding user registration, login and logout features
- **Add Donation Feature** - Allow users to donate an item. An item will have features such as title, description, category, image, pickup location
- **View Item Categories** - Show a list of all categories for users to select from when donating
- **Browse Donations by Category** - Display donations according to categories
- **Edit/Delete Donations** - Enable users to edit or remove their donations
- **Admin Login and Dashboard** - Admin panel where admins can log in and manage donations (approve, reject, edit, or delete)
- **Admin Approve or Reject Donations** - Admin should be able to approve or reject a donation submission
- **Email Confirmation on Submission** - Send an email confirmation to users when they submit an item
- **Item Pickup Status Update** - Allow users to mark items as "picked up" once they have been collected. If it availabe, the users can mark them as availabe
- **Item History for Users** - Users should be able to view their donation history
- **User Profile Page** - Allow users to view and edit their profile (e.g., change email, password)
- **Accessibility Support** - Application must be accessible (keyboard navigation, ARIA labels, Screen readers, etc.)

## Tech Stack
- **Node.js** - Backend runtime environment
- **Express.js** - Web framework for handling routing and APIs
- **MongoDB** - NoSQL database for storing users and donation items
- **REST API** - Used to handle communication between frontend and backend
- **HTML/CSS/JavaScript** - For building the user interface

## Getting Started

### Clone our Repository
```bash
git clone https://github.com/your-username/lets-donate.git
cd lets-donate