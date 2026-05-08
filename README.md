# Quantity Measurement Frontend Using React

A React-based frontend application for the Quantity Measurement API. This app allows users to convert values between different units such as length, weight, volume, and temperature using a clean and simple user interface.

---

# Project Overview

This frontend connects with a Spring Boot backend API to perform unit conversions. Users can select a measurement type, enter a value, choose source and target units, and view the converted result.

The project demonstrates:

- React component-based architecture
- API integration using Axios / Fetch
- Form handling
- State management using React hooks
- Dynamic dropdowns
- Error handling
- Responsive UI design

---

# Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend framework |
| JavaScript | Programming language |
| Axios | API communication |
| HTML | Page structure |
| CSS | Styling |
| Spring Boot API | Backend service |

---

# Features

- Convert quantity values using backend API
- Select measurement type
- Dynamic unit dropdowns based on selected type
- Display conversion result
- Show error messages for invalid inputs
- Responsive design
- Simple and user-friendly interface

---

# Supported Measurement Types

| Type | Units |
|---|---|
| Length | meter, kilometer, centimeter, millimeter, inch, foot |
| Weight | kilogram, gram, milligram, pound |
| Volume | liter, milliliter, gallon |
| Temperature | celsius, fahrenheit, kelvin |

---

# Project Structure

```bash
quantity-measurement-frontend/
│
├── public/
│   └── index.html
│
├── src/
│   ├── components/
│   │   └── QuantityConverter.jsx
│   │
│   ├── services/
│   │   └── quantityService.js
│   │
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
│
├── package.json
└── README.md
```

---

# API Integration

The frontend communicates with the Spring Boot backend API.

## Backend Base URL

```text
http://localhost:8080
```

## Convert Quantity Endpoint

```http
POST /api/quantity/convert
```

---

# Request Example

```json
{
  "type": "length",
  "value": 10,
  "fromUnit": "meter",
  "toUnit": "centimeter"
}
```

---

# Response Example

```json
{
  "success": true,
  "type": "length",
  "inputValue": 10,
  "fromUnit": "meter",
  "toUnit": "centimeter",
  "result": 1000
}
```

---

# How to Run

## 1. Clone Repository

```bash
git clone https://github.com/your-username/quantity-measurement-frontend.git
```

## 2. Open Project Folder

```bash
cd quantity-measurement-frontend
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Install Axios

```bash
npm install axios
```

## 5. Start React App

```bash
npm start
```

The app will run at:

```text
http://localhost:3000
```

---

# Backend Requirement

Make sure the Spring Boot backend is running before using the frontend.

Backend URL:

```text
http://localhost:8080
```

---

# CORS Configuration

The backend must allow requests from React.

Example Spring Boot CORS configuration:

```java
@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/quantity")
public class QuantityController {
}
```

Or global CORS configuration can be used.

---

# Example React Service

```javascript
import axios from "axios";

const API_URL = "http://localhost:8080/api/quantity";

export const convertQuantity = async (data) => {
  const response = await axios.post(`${API_URL}/convert`, data);
  return response.data;
};
```

---

# Example Component Flow

```text
1. User selects measurement type
2. Unit dropdowns update automatically
3. User enters value
4. User selects fromUnit and toUnit
5. User clicks Convert
6. React sends POST request to Spring Boot API
7. Converted result is displayed on screen
```

---

# Sample UI Fields

| Field | Description |
|---|---|
| Measurement Type | length, weight, volume, temperature |
| Value | Numeric input |
| From Unit | Unit to convert from |
| To Unit | Unit to convert to |
| Convert Button | Sends API request |
| Result Box | Displays converted value |

---

# Validation

Frontend validates:

- Value should not be empty
- Value should be numeric
- Measurement type is required
- From unit is required
- To unit is required
- From unit and To unit should not be empty

---

# Error Handling

Example error message display:

```text
Invalid unit for selected measurement type
```

Common errors handled:

- Backend server not running
- Invalid input
- Unsupported unit
- Network error
- API failure

---

# Key React Concepts Used

| Concept | Usage |
|---|---|
| Components | UI separation |
| useState | Form state management |
| Conditional Rendering | Result/error display |
| Event Handling | Button and input actions |
| Axios | API requests |
| Dynamic Rendering | Unit dropdowns |

---

# Future Enhancements

- Add conversion history page
- Add dark mode
- Add loading spinner
- Add form reset button
- Add unit tests using Jest
- Add React Router
- Add authentication
- Deploy frontend on Netlify/Vercel

