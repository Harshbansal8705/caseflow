import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Default to 'en' locale - can be extended to support more locales
  const locale = "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
