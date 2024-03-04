import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const getToday = (format = "YYYY-MM-DD") => {
  return dayjs().utc().format(format);
};

export { dayjs, getToday };
