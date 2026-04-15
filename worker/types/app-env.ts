import { Env as CoreEnv } from '../core-utils';
import { User, Session } from '../database/schema';
export type Env = CoreEnv;
export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: User;
    session: Session;
  };
};