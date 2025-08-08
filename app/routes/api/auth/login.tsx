import type { ActionFunctionArgs } from '@react-router/node';
import { ResponseUtil } from '~/utils/response.util';
import { handleError } from '~/utils/error.util';
import { Index } from '~/models/auth';
import { loginSchema } from '~/models/auth/auth.validator';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const validatedData = loginSchema.parse(data);
    const { user, tokens } = await Index.login(validatedData);
    
    const response = ResponseUtil.success({
      message: 'Login successful',
      user,
      accessToken: tokens.accessToken,
    });

    const cookies = Index.generateAuthCookies(tokens.accessToken, tokens.refreshToken);
    return ResponseUtil.withCookies(response, cookies);
    
  } catch (error) {
    const appError = handleError(error);
    return ResponseUtil.error(appError.message, appError.statusCode, appError.details);
  }
}