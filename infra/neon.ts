import { secrets } from "./secrets";

export const neon = new sst.Linkable("Neon", {
  properties: {
    url: secrets.DatabaseUrl.value,
  },
});
