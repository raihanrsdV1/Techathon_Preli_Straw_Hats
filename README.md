# Techathon Phase-01: Bistro 92 Challenge

Welcome to our submission for the Techathon Phase-01 competition. This project transforms the dining experience at Bistro 92 using smart ordering devices placed on every table.

## Submission Contents
- Solutions to Quick Fixes, Tech Tricks, Bonus Boosters, and Big Idea
- Hardware Simulation Code
- Video Demo Link: [To be attached]

---

# Quick Fixes

### Q1: Three Essential Features
1. **Interactive Menu Navigation** - Easy browsing and item selection.
2. **Real-time Order Syncing** - Instant cloud updates to kitchen.
3. **Admin Dashboard** - Real-time monitoring of orders, sales, and table statuses.

### Q2: Two Intuitive Design Principles
1. **Minimalist UI** - Simple, clutter-free display.
2. **Feedback Mechanisms** - Immediate visual or auditory feedback on button presses.

### Q3: Three Security Vulnerabilities & Solutions

| Vulnerability          | Problem                                 | Solution |
|-------------------------|-----------------------------------------|----------|
| Order Tampering         | Fake/modified orders                   | Use digital signatures |
| Theft of Device         | Device physically stolen               | Lock the device securely |
| Wi-Fi Eavesdropping     | Data interception over Wi-Fi           | Encrypt with HTTPS/TLS |

### Q4: Two Stability Strategies
1. **Local Caching** - Temporarily store orders locally and batch-send to cloud if network lags.
2. **Asynchronous Processing** - Use non-blocking order submission with retry mechanisms to avoid UI freeze.

### Q5: Inventory System Integration
## Middleware API Integration:
Build a lightweight middleware service that acts as a bridge between the smart pad ordering system and the existing inventory management system. This service would:

#### 1. Real-Time Stock Updates
- Automatically reduces stock quantities whenever an order is placed, keeping the inventory up-to-date and accurate at all times. This ensures the restaurant operates with correct stock levels and prevents stock discrepancies.

#### 2. Background Synchronization
- In case of network issues, the system temporarily caches the inventory updates locally. Once connectivity is restored, the updates are synchronized with the inventory management system, ensuring continuity of operations without data loss.

#### 3. REST API Communication
- The middleware interacts with the inventory system using secure REST APIs to push and pull data. This avoids direct manipulation of the inventory database, ensuring its integrity and security while enabling smooth data exchange.

#### 4. Transaction Logging
- Every inventory change is logged in a separate audit trail, providing traceability for each transaction. This ensures that any issues can be traced, and changes can be easily rolled back if needed.

### Benefits
This approach guarantees a non-intrusive, efficient integration of the smart pad ordering system with the inventory management system, improving inventory accuracy and providing full transparency while ensuring the smooth operation of the restaurant.

---

# Tech Tricks

### Q1: Database Schema
![Database Schema](assets/Techathon_ERD.png)


### Q2: SQL Query for Last Hour's Orders
```sql
SELECT 
    o.table_id AS table_number,
    mi.name AS item_name,
    o.order_time
FROM 
    Orders o
JOIN 
    OrderItems oi ON o.order_id = oi.order_id
JOIN 
    MenuItems mi ON oi.item_id = mi.item_id
WHERE 
    o.order_time >= NOW() - INTERVAL '1 hour'
ORDER BY 
    o.order_time DESC;
```

### Q3: Real-Time Kitchen Notifications

## Tech Stack

- **Frontend**: 
  - ESP32 (communicates via HTTP or WebSocket)

- **Backend**:
  - Node.js with Express

- **Realtime Updates**:
  - 

## Description

A system designed to provide real-time notifications to the kitchen whenever a new order is placed or updated.  
The ESP32 microcontroller acts as the client device, sending or receiving data through HTTP requests or WebSocket connections.  
The backend server handles communication, processes incoming orders, and pushes real-time updates either through PostgreSQL.

### Q4: Cloud-Based Architecture
## Tech Stack

- **Smart Pad Communication**:
  - Device communicates with the backend over HTTPS or WebSocket for real-time interaction.

- **Backend**:
  - Built with either Node.js (Express framework) to handle API requests, real-time messaging, and business logic.

- **Database**:
  - Data is stored and managed using PostgreSQL.

- **Frontend Dashboard**:
  - Developed using React, with WebSocket integration for live updates and real-time order/status monitoring.

- **Hosting and Infrastructure**:
  - Deployed on Google Cloud Platform (GCP) with Auto-scaling enabled to handle load variations.
  - Load Balancers ensure high availability and efficient traffic distribution across server instances.

## Description

This architecture supports a fully cloud-based solution where smart devices (Smart Pads) interact with backend services seamlessly and dashboards reflect changes in real-time. The system is designed to be scalable, resilient, and responsive to high traffic loads using modern cloud infrastructure.

### Q5: Real-Time Dashboard Tools
The following dashboard provides real-time data and management features for the kitchen:

- **Pending Orders**: Displays the number of orders that are yet to be fulfilled.
- **Completed Orders**: Shows the number of orders that have been successfully fulfilled.
- **Average Fulfillment Time**: Shows the average time taken to complete an order.
- **Total Sales**: Displays the total sales amount for the current period.
- **Kitchen Management**: Allows admins to **add** or **remove menu items** dynamically from the system.

### Tools and Justifications

- **Frontend**: 
  - **React**: Chosen for building a dynamic, responsive user interface, ideal for real-time updates and interactive elements like dashboards.
  
- **Backend**:
  - **Node.js with Express**: Provides a lightweight, high-performance backend suitable for handling real-time requests and managing APIs for order and menu management.
  
- **Real-Time Communication**:
  - **Socket.IO**: Enables real-time, bidirectional communication between the server and frontend, essential for updating orders, sales, and statuses instantaneously.

- **Database**:
  - **PostgreSQL**: PostgreSQL ensures robust data handling and simplifies backend operations, providing authentication, real-time subscriptions, and database management.

This stack ensures a scalable, efficient, and interactive dashboard that can handle high-volume orders and kitchen management tasks in real time.

![Admin Dashboard](assets/Admin_Dashboard.jpg)
---

# Bonus Boosters

### Q1: RESTful API for Order Placement
**Endpoints**:
- `POST /order`
- `GET /order/:id`
- `POST /order/:id/items`
- `POST /order/submit`

### Q2: Extreme Scalability Strategies

#### 1. **Load Balancers (NGINX, HAProxy)**
   - **NGINX/HAProxy** are used to distribute incoming traffic evenly across multiple instances of the application. This prevents any single server from being overwhelmed, ensuring high availability and fault tolerance.

#### 2. **Microservices Architecture**
   - A **Microservices Architecture** is employed to break the application into smaller, independently deployable services (e.g., Order Service, Payment Service, Inventory Service). Each microservice can be scaled independently, improving overall performance and resilience.

#### 3. **Message Queues (Kafka/RabbitMQ)**
   - **Kafka** or **RabbitMQ** are used for asynchronous communication between services. This ensures that even during traffic spikes, the orders are processed in a queue, preventing data loss and ensuring messages are not lost when systems experience delays.

#### 4. **NoSQL Databases with Partitioning**
   - A **NoSQL Database** (like **MongoDB** or **Cassandra**) is used to store orders and other unstructured data, with data partitioning techniques (sharding) to distribute the load across multiple database nodes. This enables horizontal scalability, improving performance during high-load situations.

#### 5. **Rate Limiting and Horizontal Scaling**
   - **Rate Limiting** ensures that the system can handle sudden spikes in traffic without getting overwhelmed, by limiting the number of requests from a single client in a given time period.
   - **Horizontal Scaling** allows the system to add more servers or containers as demand increases, distributing the load and increasing the system’s overall capacity to handle more simultaneous orders.
---

# Big Idea

### Smart Dietary Filter and Allergy Detection System

**Problem**:  
- Difficulty for customers with dietary restrictions or allergies.

**Solution**:  
- Add a smart filter to the ordering pad, allowing users to:
  - Select dietary preferences (e.g., Vegan, Gluten-Free)
  - Mark allergens (e.g., nuts, dairy)
  - Automatically filter or flag menu items accordingly.

**Impact**:  
- Healthier and safer dining experience  
- Improved customer satisfaction  
- Personalized menu navigation

---

### Language Barrier/Confusion for Non-Native or Foreign Customers

**Problem**:  
- Language barrier or confusion for non-native or foreign customers when navigating the menu or placing orders.

**Solution**:  
- Add a **multilingual voice assistant** powered by **ESP32** and **Google Cloud Text-to-Speech API**.
  - Detect the table’s language preference or offer a selection at the beginning.
  - Each item on the menu can be read out loud in the selected language, ensuring customers understand the options available.

**Why it Matters**:  
- Enhances accessibility for a diverse customer base.
- Reduces mistakes due to miscommunication.
- Personalizes the dining experience for customers of different linguistic backgrounds.

---

# Submission Info
- **Video Demo**: [Google Drive Link Here]

Thank you for considering our solution for Techathon Phase-01!

