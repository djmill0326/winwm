// module. count: 2
const baseUrl = "https://osu.ppy.sh/api/v2";
const authUrl = "https://osu.ppy.sh/oauth/authorize";
const redirUrl = "http://ehpt.org/cb/osu";
const clientId = "32919";
const scopeParams = "public chat.read chat.write chat.write_manage";
export const authReqUrl = `${authUrl}?client_id=${clientId}&redirect_uri=${redirUrl}&response_type=code&scope=${scopeParams}`;
export default authReqUrl;

const auth_tokens = new Map();
export const parse_callback = (loc) => {
    try {
        if (!loc.pathname.startsWith("/cb/")) return false;
        const tag = loc.pathname.substring(4, loc.pathname.length);
        const parsed = {};
        loc.search.substring(1, loc.search.length).split("&").forEach(p => {
            const [k, v] = p.split("=");
            parsed[k] = v;
        });
        let was_set;
        switch (tag) {
            case "osu":
                if (parsed.code && parsed.code.length) {
                    auth_tokens.set("osu", parsed.code);
                    was_set = true;
                }
                break;
        }
        if (was_set) {
            console.info(`Successfully authenticated. (${tag})`, auth_tokens.get("osu"));
            return tag;
        }
    } catch (_) {}
};

inject("authReqUrl", authReqUrl);
inject("parse_callback", parse_callback);