# Concurrent Ticketing Service

A production-oriented backend system that focuses on safe ticket reservations under concurrent load.

The project simulates real-world ticket booking scenarios where multiple users attempt to reserve or purchase the same ticket at the same time. It explores backend engineering concepts such as transactions, race condition prevention, caching, background processing, and real-time updates.

## Problem

Ticketing systems face a fundamental challenge:

- Only a limited number of tickets exist.
- Multiple users may attempt to reserve the same ticket simultaneously.
- Users may abandon reservations without completing payment.
- The system must remain consistent even under heavy traffic.

This project is designed to solve these problems safely and efficiently.

## Goals

- Prevent double booking of tickets
- Handle concurrent reservation requests safely
- Provide temporary ticket reservations
- Automatically release expired reservations
- Deliver real-time seat availability updates
- Improve performance using caching
- Apply production-oriented backend design patterns

## Core Features

### Event Management
- Create and manage events
- Configure ticket inventory and seat availability

### Ticket Reservation
- Reserve tickets temporarily
- Protect inventory from race conditions
- Support concurrent booking attempts

### Ticket Purchase
- Convert reservations into confirmed purchases
- Prevent duplicate purchase requests using idempotency

### Reservation Expiration
- Automatically release unpaid reservations after a configurable timeout
- Background processing using job queues

### Real-Time Updates
- Broadcast seat availability changes
- Notify connected clients when reservations or purchases occur

### Caching
- Cache frequently accessed event and ticket information
- Reduce database load and improve response times

### Rate Limiting
- Protect endpoints from abuse and excessive requests

## Backend Concepts Explored

### Concurrency
Understanding how multiple users interact with the same data simultaneously.

Topics:
- Race Conditions
- Transactions
- Isolation Levels
- Row Locking
- Idempotency

### Redis
Using Redis as a high-speed data layer.

Topics:
- Caching
- TTL (Time To Live)
- Temporary reservations
- Real-time state management

### Background Jobs
Using asynchronous workers to process delayed tasks.

Topics:
- Job Queues
- Worker Processes
- Reservation Cleanup

### Real-Time Communication
Using WebSockets to push updates instantly to connected clients.

Topics:
- Live Seat Availability
- Event Broadcasting
- Client Synchronization

## High-Level Architecture

```text
Client
  │
  ▼
Backend API
  │
  ├── PostgreSQL
  │      Source of Truth
  │
  ├── Redis
  │      Cache
  │      Reservation TTL
  │      Real-Time State
  │
  ├── WebSockets
  │      Live Updates
  │
  └── BullMQ Workers
         Reservation Expiration
         Background Processing
```

## Learning Objectives

This project is intended to provide hands-on experience with:

- Building production-style backend systems
- Designing for correctness under concurrency
- Working with Redis beyond simple caching
- Implementing background job processing
- Developing real-time applications
- Applying system design principles in practice

## Project Status

🚧 In Development

The system is being built incrementally with a strong focus on understanding backend engineering concepts rather than simply implementing features.