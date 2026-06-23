// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_futuristic_ego.sql';
import m0001 from './0001_cute_the_enforcers.sql';
import m0002 from './0002_flippant_amazoness.sql';
import m0003 from './0003_persons_feature.sql';
import m0004 from './0004_performance_indexes.sql';
import m0005 from './0005_brave_the_leader.sql';
import m0006 from './0006_little_wind_dancer.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006
    }
  }
  