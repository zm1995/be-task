import { DynamicModule, Module } from "@nestjs/common";
import { BalanceService } from "./services/balanceService";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transactions } from "../../entities/transactions.entity";
import { Balances } from "../../entities/balances.entity";
import { BalanceController } from "./controllers/balanceController";
import { User } from "../../entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Transactions, Balances, User])],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {

}