## Description

A NestJS-based backend application for managing user balances and transactions. This application provides RESTful APIs to issue transactions and manage user account balances with support for batch transaction processing.

## Features

- User balance management
- Transaction processing with batch insert support
- PostgreSQL database integration
- Transaction-based operations for data consistency
- RESTful API endpoints

## Database Setup

The application uses PostgreSQL. You can initialize the database using the provided SQL script:

```bash
# Connect to your PostgreSQL database and run:
psql -U your_username -d your_database -f dbinit/initdb.sql
```

Or manually execute the SQL commands in `dbinit/initdb.sql` to create the required tables:
- `user` - User accounts
- `balances` - User balances (OneToOne relationship with user)
- `transactions` - Transaction history (ManyToOne relationship with user)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
NODE_ENV=development
PORT=3000
```

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Endpoints

### Get User Balance
- **GET** `/balance`
- **Description**: Retrieves the balance for the authenticated user
- **Headers**: Requires user authentication (user ID in request)
- **Response**: User balance information

### Issue Transactions
- **POST** `/balance/transactions`
- **Description**: Issues multiple transactions in batch. Transactions are grouped by user, sorted chronologically, and processed atomically.
- **Request Body**:
  ```json
  {
    "transactions": [
      {
        "userId": 1,
        "amount": 100.50,
        "endingBalance": 100.50
      },
      {
        "userId": 2,
        "amount": -50.25,
        "endingBalance": 50.25
      }
    ],
    "option": true
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "processed": 2,
    "transactions": [
      {
        "referenceNumber": "TXN-...",
        "userId": 1,
        "transactionAmount": 100.50,
        "endingBalance": 100.50,
        "updatedDateTime": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

**Note**: The `option` field is a boolean that can be used to control transaction processing behavior.


## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
