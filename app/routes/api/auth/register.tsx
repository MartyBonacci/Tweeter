import type { ActionFunctionArgs } from '@react-router/node';
import { ResponseUtil } from '~/utils/response.util';
import { handleError } from '~/utils/error.util';
import { AuthService } from '~/services/auth.service';
import { registerSchema } from '~/validators/auth.validator';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const validatedData = registerSchema.parse(data);
    const { user } = await AuthService.register(validatedData);
    
    return ResponseUtil.created({
      message: 'User registered successfully',
      user,
    });
    
  } catch (error) {
    const appError = handleError(error);
    return ResponseUtil.error(appError.message, appError.statusCode, appError.details);
  }
}