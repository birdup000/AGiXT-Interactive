import { NextRequest } from 'next/server';

export const AuthMode = {
  None: 0,
  GTAuth: 1,
  MagicalAuth: 2,
};
export const getAuthMode = (): number => {
  let authMode = AuthMode.None;
  if (process.env.NEXT_PUBLIC_AUTH_WEB && process.env.NEXT_PUBLIC_AGIXT_SERVER) {
    if (process.env.APP_URI && process.env.NEXT_PUBLIC_AUTH_WEB.startsWith(process.env.APP_URI)) {
      authMode = AuthMode.MagicalAuth;
      if (!process.env.NEXT_PUBLIC_AUTH_WEB.endsWith('/user')) {
        throw new Error('Invalid AUTH_WEB. For Magical Auth implementations, AUTH_WEB must point to APP_URI/user.');
      }
    } else {
      authMode = AuthMode.GTAuth;
    }
  }
  return authMode;
};

export const getJWT = (req: NextRequest) => {
  const rawJWT = req.cookies.get('jwt')?.value;
  // Strip any and all 'Bearer 's off of JWT.
  const jwt = rawJWT?.split(' ')[rawJWT?.split(' ').length - 1] ?? rawJWT ?? '';
  console.log('JWT:', jwt);
  return jwt;
};
export const verifyJWT = async (jwt: string): Promise<Response> => {
  if (!process.env.SERVERSIDE_AGIXT_SERVER) {
    process.env.SERVERSIDE_AGIXT_SERVER = ['agixt', 'localhost', 'back-end', 'boilerplate', 'back-end-image'].join(',');
    console.log('Initialized container names: ', process.env.SERVERSIDE_AGIXT_SERVER);
  }
  const containerNames = process.env.SERVERSIDE_AGIXT_SERVER.split(',');
  const responses = {} as any;
  const authEndpoint = `${process.env.AGIXT_SERVER}/v1/user`;
  let response;
  for (const containerName of containerNames) {
    const testEndpoint = authEndpoint.replace('localhost', containerName);
    console.log(`Verifying JWT Bearer ${jwt} with server at ${testEndpoint}...`);
    try {
      response = await fetch(testEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${jwt}`,
        },
      });

      if (response.status === 200 || [401, 402, 403].includes(response.status)) {
        console.log(`Successfully contacted server at ${testEndpoint}!`);
        if (Object.keys(responses).length > 0) {
          containerNames.sort((a, b) => {
            if (a === containerName) {
              return -1;
            } else if (b === containerName) {
              return 1;
            } else {
              return 0;
            }
          });
          process.env.SERVERSIDE_AGIXT_SERVER = containerNames.join(',');
          console.log('New container names: ', process.env.SERVERSIDE_AGIXT_SERVER);
        }
        return response;
      } else {
        responses[testEndpoint] = await response.text();
        console.log(`Failed to contact server at ${testEndpoint}.`);
      }
    } catch (exception) {
      responses[testEndpoint] = exception;
    }
  }
  console.error('Failed to contact any of the following servers: ', JSON.stringify(responses));
  for (const key of Object.keys(responses)) {
    console.error(key, responses[key]);
  }
  return new Response();
};
