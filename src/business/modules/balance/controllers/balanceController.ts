import { Controller, Get, Post, Req, Body, HttpException, HttpStatus } from "@nestjs/common";
import { Request } from "express";
import { BalanceService } from "../services/balanceService";
import { IssueTransactionsDto } from "../dto/issue-transactions.dto";

@Controller('balance')
export class BalanceController {
    constructor(private readonly balanceService: BalanceService) {}

    @Get()
    getBalance(@Req() req: Request & { user?: { id: number } }) {
      try {
        return this.balanceService.getUserBalance(req.user?.id || 0);
      } catch (error) {
        throw new HttpException(`Failed to get balance: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    @Post('transactions')
    issueTransactions(@Body() issueTransactionsDto: IssueTransactionsDto) {
        try {
            return this.balanceService.issueTransactions(issueTransactionsDto);
        } catch (error) {
            throw new HttpException(`Failed to issue transactions: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}