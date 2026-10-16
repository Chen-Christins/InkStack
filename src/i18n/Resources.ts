/**
 * i18n 资源汇总（以 zh-CN 为 source of truth）
 *
 * 新增模块时：在 locales/<lang>/ 下补同名命名空间文件，并在此登记。
 */

import commonZh from "./locales/zh-CN/Common";
import navZh from "./locales/zh-CN/Nav";
import authZh from "./locales/zh-CN/Auth";
import errorZh from "./locales/zh-CN/Error";
import articleZh from "./locales/zh-CN/Article";
import adminZh from "./locales/zh-CN/Admin";
import personalZh from "./locales/zh-CN/Personal";
import rdZh from "./locales/zh-CN/Rd";
import calendarZh from "./locales/zh-CN/Calendar";
import enumsZh from "./locales/zh-CN/Enums";
import organizationZh from "./locales/zh-CN/Organization";
import assignmentZh from "./locales/zh-CN/Assignment";
import userZh from "./locales/zh-CN/User";
import profileZh from "./locales/zh-CN/Profile";
import componentsZh from "./locales/zh-CN/Components";
import homeZh from "./locales/zh-CN/Home";
import blogZh from "./locales/zh-CN/Blog";
import servicesZh from "./locales/zh-CN/Services";
import sampleZh from "./locales/zh-CN/Sample";

import commonEn from "./locales/en-US/Common";
import navEn from "./locales/en-US/Nav";
import authEn from "./locales/en-US/Auth";
import errorEn from "./locales/en-US/Error";
import articleEn from "./locales/en-US/Article";
import adminEn from "./locales/en-US/Admin";
import personalEn from "./locales/en-US/Personal";
import rdEn from "./locales/en-US/Rd";
import calendarEn from "./locales/en-US/Calendar";
import enumsEn from "./locales/en-US/Enums";
import organizationEn from "./locales/en-US/Organization";
import assignmentEn from "./locales/en-US/Assignment";
import userEn from "./locales/en-US/User";
import profileEn from "./locales/en-US/Profile";
import componentsEn from "./locales/en-US/Components";
import homeEn from "./locales/en-US/Home";
import blogEn from "./locales/en-US/Blog";
import servicesEn from "./locales/en-US/Services";
import sampleEn from "./locales/en-US/Sample";

export const resources = {
    "zh-CN": {
        common: commonZh,
        nav: navZh,
        auth: authZh,
        error: errorZh,
        article: articleZh,
        admin: adminZh,
        personal: personalZh,
        rd: rdZh,
        calendar: calendarZh,
        enums: enumsZh,
        organization: organizationZh,
        assignment: assignmentZh,
        user: userZh,
        profile: profileZh,
        components: componentsZh,
        home: homeZh,
        blog: blogZh,
        services: servicesZh,
        sample: sampleZh,
    },
    "en-US": {
        common: commonEn,
        nav: navEn,
        auth: authEn,
        error: errorEn,
        article: articleEn,
        admin: adminEn,
        personal: personalEn,
        rd: rdEn,
        calendar: calendarEn,
        enums: enumsEn,
        organization: organizationEn,
        assignment: assignmentEn,
        user: userEn,
        profile: profileEn,
        components: componentsEn,
        home: homeEn,
        blog: blogEn,
        services: servicesEn,
        sample: sampleEn,
    },
} as const;

export default resources;
