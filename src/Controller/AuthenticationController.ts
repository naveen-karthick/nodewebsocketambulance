import { Controller, JsonController, Param, Body, Req, Get, Post, Res, Put, Delete } from "routing-controllers";
@JsonController("/form")
export class AuthenticationController {

    @Get("/submit")
    async verifyCaptcha(@Req() req: any,@Body() body ,@Res() res, ): Promise<any> {
        console.log(req.body);
        console.log(body);
        return "hello";
    }

}