import type { ActionFunctionArgs } from '@react-router/node';
import { ResponseUtil } from '~/utils/response.util';
import { handleError } from '~/utils/error.util';
import { AuthService } from '~/services/auth.service';
import { loginSchema } from '~/validators/auth.validator';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const validatedData = loginSchema.parse(data);
    const { user, tokens } = await AuthService.login(validatedData);
    
    const response = ResponseUtil.success({
      message: 'Login successful',
      user,
      accessToken: tokens.accessToken,
    });

    const cookies = AuthService.generateAuthCookies(tokens.accessToken, tokens.refreshToken);
    return ResponseUtil.withCookies(response, cookies);
    
  } catch (error) {
    const appError = handleError(error);
    return ResponseUtil.error(appError.message, appError.statusCode, appError.details);
  }
}