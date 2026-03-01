import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { IssueTransactionsDto, TransactionDto } from "../dto/issue-transactions.dto";
import { Transactions } from "../../../entities/transactions.entity";
import { Balances } from "../../../entities/balances.entity";

@Injectable()
export class BalanceService {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
        @InjectRepository(Balances)
        private readonly balanceRepository: Repository<Balances>,
        @InjectRepository(Transactions)
        private readonly transactionRepository: Repository<Transactions>,
    ) {}

    async getUserBalance(userId: number) {
        const userBalance = await this.balanceRepository.findOne({ where: { userId } });
        return userBalance?.balance ?? 0;
    }

    async issueTransactions(issueTransactionsDto: IssueTransactionsDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const {transactions, option} = issueTransactionsDto;
        try {
            // Step 1: Group transactions by userId
            const transactionsByUser = new Map<number, TransactionDto[]>();
            for (const tx of transactions) {
                if (!transactionsByUser.has(tx.userId)) {
                    transactionsByUser.set(tx.userId, []);
                }
                transactionsByUser.get(tx.userId)!.push(tx);
            }

            // Step 2: Sort each group by index (maintain order) and prepare with timestamps
            const baseTime = Date.now();
            const allTransactionEntities: Transactions[] = [];
            const userFinalBalances = new Array<{userId: number, balance: number, updatedAt: Date}>(); // userId -> final balance
            const errorFinalBalances = new Array<{userId: number, error: string}>();
            for (const [userId, userTransactions] of transactionsByUser.entries()) {

                // Get current balance for this user
                let balanceBefore = await this.getUserBalance(userId);
                let balanceAfter = balanceBefore;
                let allTransactionEntities: Transactions[] = [];
                
                // Process each transaction for this user in order
                for (const tx of userTransactions) {
                  balanceAfter = balanceBefore + tx.amount;
                  
                  //
                  if (option && balanceAfter < 0) {
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
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Release query runner
            await queryRunner.release();
        }
    }
}
