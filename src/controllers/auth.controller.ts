import { Request, Response } from "express";
import * as Yup from "yup";
import UserModel from "../models/user.model";
import { encrypt } from "../utils/encryption";
import { generateToken } from "../utils/jwt";
import { ROLES } from "../utils/constant";
import { IReqUser } from "../utils/interfaces";
import response from "../utils/response";

type TRegister = {
  fullName: string;
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type TLogin = {
  identifier: string;
  password: string;
};

const regiterValidatorSchema = Yup.object({
  fullName: Yup.string().required(),
  userName: Yup.string().required(),
  email: Yup.string().email().required(),
  password: Yup.string()
    .required()
    .min(8, "Password must be at least 8 characters")
    .test(
      "at least one number",
      "Password must contain at least one number",
      (value) => {
        if (!value) return false;

        const regex = /(?=.*\d)/;
        return regex.test(value);
      }
    ),
  confirmPassword: Yup.string()
    .required()
    .min(8)
    .oneOf([Yup.ref("password")], "Password does not match"),
});

export default {
  async register(req: Request, res: Response) {
    /**
     #swagger.tags = ["Auth"]
     swagger.tags = ["Auth"]
     */
    const { fullName, userName, email, password, confirmPassword } =
      req.body as unknown as TRegister;

    try {
      await regiterValidatorSchema.validate({
        fullName,
        userName,
        email,
        password,
        confirmPassword,
      });

      const result = await UserModel.create({
        fullName,
        userName,
        email,
        password,
        role: ROLES.MEMBER,
      });

      response.success(res, result, "success Registration");
    } catch (error) {
      const err = error as unknown as Error;
      response.error(res, error, "failed registration");
    }
  },

  async login(req: Request, res: Response) {
    /**
     * #swagger.tags = ["Auth"]
     #swagger.requestBody = {
     required: true,
     schema: {$ref: "#/components/schemas/LoginRequest"}
     }
     */
    const { identifier, password } = req.body as unknown as TLogin;
    try {
      const userByIdentifier = await UserModel.findOne({
        $or: [
          {
            email: identifier,
          },
          {
            userName: identifier,
          },
        ],
        isActive: true,
      });

      if (!userByIdentifier) {
        return response.unauthorized(res, "user not found");
      }

      const validatePassword: boolean =
        encrypt(password) === userByIdentifier.password;

      if (!validatePassword) {
        return response.unauthorized(res, "user not found");
      }

      const token = generateToken({
        id: userByIdentifier._id,
        role: userByIdentifier.role,
      });

      response.success(res, token, "success login!");
    } catch (error) {
      const err = error as unknown as Error;
      response.error(res, error, "login failed!");
    }
  },

  async me(req: IReqUser, res: Response) {
    /**
     * #swagger.tags = ["Auth"]
     #swagger.security = [{
     "bearerAuth": []
     }]
     */
    try {
      const user = req.user;
      const result = await UserModel.findById(user?.id);

      response.success(res, result, "success get user!");
    } catch (error) {
      const err = error as unknown as Error;
      response.error(res, error, "get user failed!");
    }
  },

  async activation(req: Request, res: Response) {
    /**
     * #swagger.tags = ["Auth"]
     #swagger.requestBody = {
     required: true,
     schema: {$ref: "#/components/schemas/ActivationRequest"}
     }
     */
    try {
      const { code } = req.body as { code: string };

      const user = await UserModel.findOneAndUpdate(
        {
          activationCode: code,
        },
        {
          isActive: true,
        },
        {
          new: true,
        }
      );

      response.success(res, user, "user successfully activated!");
    } catch (error) {
      const err = error as unknown as Error;
      response.error(res, error, "activation failed!");
    }
  },
};
