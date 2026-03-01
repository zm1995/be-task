import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { IssueTransactionsDto, TransactionDto } from "../dto/issue-transactions.dto";
import { Transactions } from "../../../entities/transactions.entity";
import { Balances } from "../../../entities/balances.entity";

@Injectable()
export class BalanceService {
    private readonly logger = new Logger(BalanceService.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
        @InjectRepository(Balances)
        private readonly balanceRepository: Repository<Balances>,
        @InjectRepository(Transactions)
        private readonly transactionRepository: Repository<Transactions>,
    ) {}

    async getUserBalance(userId: number) {
        this.logger.log(`Getting balance for user: ${userId}`);
        const userBalance = await this.balanceRepository.findOne({ where: { userId } });
        const balance = userBalance?.balance ?? 0;
        this.logger.log(`User ${userId} balance: ${balance}`);
        return balance;
    }

    async issueTransactions(issueTransactionsDto: IssueTransactionsDto) {
        const {transactions, option} = issueTransactionsDto;
        this.logger.log(`Processing ${transactions.length} transactions with option: ${option}`);
        
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            // Step 1: Group transactions by userId
            const transactionsByUser = new Map<number, TransactionDto[]>();
            for (const tx of transactions) {
                if (!transactionsByUser.has(tx.userId)) {
                    transactionsByUser.set(tx.userId, []);
                }
                transactionsByUser.get(tx.userId)!.push(tx);
            }

            //for batch insert transactions
            const allTransactionEntities: Transactions[] = [];
            //for each user, update balances
            const userFinalBalances = new Array<{userId: number, balance: number, updatedAt: Date}>(); 
            //for each user, if there is an error, add to errorFinalBalances
            const errorFinalBalances = new Array<{userId: number, error: string}>();
            for (const [userId, userTransactions] of transactionsByUser.entries()) {

                // Get current balance for this user
                let balanceBefore = await this.getUserBalance(userId);
                let balanceAfter = balanceBefore;
                let allTransactionEntities: Transactions[] = [];
                
                // Process each transaction for this user in order
                for (const tx of userTransactions) {
                  balanceAfter = balanceBefore + tx.amount;
                  
                  //if option is true and balanceAfter is less than 0, add to errorFinalBalances
                  if (option && balanceAfter < 0) {
                    this.logger.warn(`Transaction rejected for user ${userId}: Balance would be negative (${balanceAfter})`);
                    errorFinalBalances.push({userId, error: 'Balance is less than 0'});
                    break;
                  }
                  // Create transaction entity
                  const transactionEntity = new Transactions();
                  transactionEntity.userId = userId;
                  transactionEntity.transactionAmount = tx.amount;
                  transactionEntity.endingBalance = balanceAfter;
                  transactionEntity.createdAt = new Date();
                  allTransactionEntities.push(transactionEntity);
                }
                await queryRunner.manager.save(Transactions, allTransactionEntities);
                await queryRunner.manager.update(Balances, userId,{
                    balance: balanceAfter,
                    updatedAt: new Date(),
                });
                userFinalBalances.push({userId, balance: balanceAfter, updatedAt: new Date()});
            }

            // Commit transaction
            await queryRunner.commitTransaction();
            this.logger.log(`Successfully processed ${allTransactionEntities.length} transactions for ${transactionsByUser.size} users`);

            return {
                success: true,
                processed: transactions.length,
                balances: userFinalBalances.map(tx => ({
                    userId: tx.userId,
                    balance: tx.balance,
                    updatedAt: tx.updatedAt,
                })),
                errors: errorFinalBalances.map(tx => ({
                    userId: tx.userId,
                    error: tx.error,
                })),
            };
        } catch (error) {
            // Rollback on error
            this.logger.error(`Error processing transactions: ${error.message}`, error.stack);
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Release query runner
            await queryRunner.release();
        }
    }
}
