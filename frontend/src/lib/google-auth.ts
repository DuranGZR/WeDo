import { t } from '@/i18n';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

let configured = false;

export async function getGoogleIdToken(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    throw new Error(t('common.googleSignInIsOnlySetUpForIosIn'));
  }
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new Error(t('common.useAWedoDevelopmentOrTestflightBuildToSignIn'));
  }
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!webClientId || !iosClientId) {
    throw new Error(t('common.googleSignInHasnTBeenSetUpYet'));
  }

  // Load only after the Expo Go/platform guards; its native module is absent there.
  const { GoogleSignin, isErrorWithCode, statusCodes } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  if (!configured) {
    GoogleSignin.configure({ webClientId, iosClientId, offlineAccess: false });
    configured = true;
  }
  try {
    const result = await GoogleSignin.signIn();
    if (result.type === 'cancelled') return null;
    if (!result.data.idToken) {
      throw new Error(t('common.weCouldnTGetYourGoogleSignInTokenPlease'));
    }
    return result.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
      if (error.code === statusCodes.IN_PROGRESS) return null;
      throw new Error(t('common.couldnTCompleteGoogleSignInPleaseTryAgain'));
    }
    throw error;
  }
}
