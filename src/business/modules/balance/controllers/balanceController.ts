import { Controller, Get, Post, Req, Body } from "@nestjs/common";
import { Request } from "express";
import { BalanceService } from "../services/balanceService";
import { IssueTransactionsDto } from "../dto/issue-transactions.dto";

@Controller('balance')
export class BalanceController {
    constructor(private readonly balanceService: BalanceService) {}

    @Get()
    getBalance(@Req() req: Request & { user?: { id: number } }) {
        return this.balanceService.getUserBalance(req.user?.id || 0);
    }

    @Post('transactions')
    issueTransactions(@Body() issueTransactionsDto: IssueTransactionsDto) {
        return this.balanceService.issueTransactions(issueTransactionsDto);
    }
}