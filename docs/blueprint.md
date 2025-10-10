# **App Name**: SwiftRoute

## Core Features:

- Firebase Authentication: Enable Firebase Email/Password login and role-based access control (Admin, Manager, Driver, Employee) with protected routes.
- Dashboard KPIs and Stats: Display key performance indicators (KPIs) like total revenue, total expenses, net profit, and quick statistics such as the number of buses, drivers, trips, and passengers, using data fetched from Firestore.
- Bus Management: Enable adding, editing, deleting, and listing all buses with details such as name/number, plate number, capacity, maintenance status, assigned driver. Store bus images in Firebase Storage and bus data in Firestore.
- Employee Management: Add, edit, and delete employee profiles, track attendance and salary payments, manage fields: full name, role, contact info, salary, and profile photo. Profile pictures are stored in Firebase storage.
- Automated Trip Assignment Tool: Add new trips with routes (From → To), including details like assigned bus and driver (with auto-assignment option), date/time, ticket price, and available seats. The AI tool assists the admin when deciding if they should override system suggested assignments of equipment to a new route.
- Ticket Booking System: Allow customers to book tickets, track available and booked seats, and store ticket information (trip ID, customer name, seat number, price, etc.) in Firestore.
- Finance Management: Track income (ticket sales) and expenses (salaries, maintenance, rent, etc.) and display a monthly breakdown and profit/loss summary from data pulled from the Firestore.

## Style Guidelines:

- Primary color: Deep Blue (#1E3A8A) to evoke trust and reliability.
- Background color: Light Gray (#F9FAFB) for a clean, spacious feel.
- Accent color: Orange (#E67700) to highlight key actions and important information.
- Body and headline font: 'Inter', a sans-serif font, for a modern and clean look. Use 'Source Code Pro' to display any computer code that might be part of this app.
- Clean and modern admin dashboard with a sidebar, top navbar, and responsive layout, leveraging Tailwind CSS and shadcn/ui components for reusable elements like forms, tables, and cards.
- Use simple and consistent icons from a library like FontAwesome or Material Icons to represent different entities like buses, drivers, and trips.
- Subtle animations, such as transition effects when loading data or navigating between sections, will be used to enhance user experience.