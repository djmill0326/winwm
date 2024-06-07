export const template_path = "template";
export const resolve_path = (separator = "/", root = "/") => (...join) => root + join.join(separator);
