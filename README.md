## Description

A NestJS-based backend application for managing user balances and transactions. This application provides RESTful APIs to issue transactions and manage user account balances with support for batch transaction processing.

## Features

- User balance management
- Transaction processing with batch insert support
- PostgreSQL database integration
- Transaction-based operations for data consistency
- RESTful API endpoints
- Winston logging with file and console transports

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
LOG_LEVEL=info
```

**Log Levels**: `error`, `warn`, `info`, `debug`, `verbose`

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
    "processed": 3,
    "transactions": [
      {
        "userId": 1,
        "endingBalance": 100.50,
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "userId": 2,
        "endingBalance": 50.25,
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "errors": [
      {
        "userId": 3,
        "error": "Balance is less than 0"
      }
    ]
  }
  ```

**Note**: The `option` field is a boolean that can be used to control transaction processing behavior.

## Logging

The application uses Winston for logging with the following configuration:

- **Console Transport**: Colored output for development
- **File Transport**: 
  - `logs/error.log` - Error level logs only
  - `logs/combined.log` - All logs

Log files are automatically rotated when they reach 5MB, keeping up to 5 files.

### Using the Logger

The logger is integrated into NestJS and can be used in any service:

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class YourService {
  private readonly logger = new Logger(YourService.name);

  someMethod() {
    this.logger.log('Info message');
    this.logger.warn('Warning message');
    this.logger.error('Error message', error.stack);
    this.logger.debug('Debug message');
  }
}
```
