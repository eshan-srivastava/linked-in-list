export type TitleFormat = "compact" | "verbose";

interface ParsedParams {
  keywords?: string;
  location?: string;
  timePosted?: string;
  experienceLevel?: string;
  jobType?: string;
  remote?: string;

  //TODO: EXTEND THIS WITH MORE QUERY PARAMS
}

export class LinkedInSearchParser {
  private static EXPERIENCE_MAP: Record<string, string> = {
    "1": "Internship",
    "2": "Entry",
    "3": "Associate",
    "4": "Mid-Senior",
    "5": "Director",
    "6": "Executive",
  };

  static parseUrl(url: string): ParsedParams {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      keywords: params.get("keywords") || undefined,
      location: this.parseLocation(
        params.get("geoUrn") || params.get("location"),
      ),
      timePosted: this.parseTime(params.get("f_TPR")),
      experienceLevel: this.parseExperience(params.get("f_E")),
      jobType: this.parseJobType(params.get("f_JT")),
      remote: params.get("f_WT")?.includes("2") ? "Remote" : undefined,
    };
  }

  private static parseTime(timeStr: string | null): string | undefined {
    if (timeStr == null || timeStr == "") {
      return undefined;
    }
    const secondsStr = timeStr.slice(1);
    const totalSeconds = parseInt(secondsStr, 10);
    if (isNaN(totalSeconds)) {
      return undefined;
    }

    const days = Math.floor(totalSeconds / 86400);
    let remaining = totalSeconds % 86400;
    const hours = Math.floor(remaining / 3600);
    remaining = remaining % 3600;
    const minutes = Math.floor(remaining / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} Days`);
    if (hours > 0) parts.push(`${hours} Hours`);
    if (minutes > 0) parts.push(`${minutes} minutes`);

    return parts.join(" ") || "0 minutes";
  }

  private static parseLocation(geoUrn: string | null): string | undefined {
    if (!geoUrn) return undefined;
    // Extract city name from geoUrn if structured, otherwise return as-is
    const match = geoUrn.match(/urn:li:fsd_geo:(\d+)/);
    return match ? `Geo-${match[1]}` : geoUrn;
  }

  private static parseExperience(exp: string | null): string | undefined {
    if (!exp) return undefined;
    const levels = exp
      .split(",")
      .map((e) => this.EXPERIENCE_MAP[e])
      .filter(Boolean);
    return levels.join("/");
  }

  private static parseJobType(jt: string | null): string | undefined {
    const types: Record<string, string> = {
      F: "Full-time",
      P: "Part-time",
      C: "Contract",
      T: "Temporary",
      I: "Internship",
    };
    if (!jt) return undefined;
    return jt
      .split(",")
      .map((t) => types[t])
      .filter(Boolean)
      .join("/");
  }

  static generateTitle(parsed: ParsedParams, format: TitleFormat): string {
    if (format === "compact") {
      return this.compactTitle(parsed);
    }
    return this.verboseTitle(parsed);
  }

  private static compactTitle(parsed: ParsedParams): string {
    const parts: string[] = [];
    if (parsed.keywords) parts.push(this.abbreviate(parsed.keywords));
    if (parsed.location) parts.push(parsed.location);
    if (parsed.timePosted) parts.push(parsed.timePosted);
    if (parsed.remote) parts.push(parsed.remote);
    return parts.join(" | ") || "LinkedIn Search";
  }

  private static verboseTitle(parsed: ParsedParams): string {
    const parts: string[] = [];
    if (parsed.keywords) parts.push(parsed.keywords);
    if (parsed.location) parts.push(`in ${parsed.location}`);
    if (parsed.timePosted) parts.push(`(${parsed.timePosted})`);
    if (parsed.remote) parts.push("[Remote]");
    return parts.join(" ") || "LinkedIn Search";
  }

  private static abbreviate(text: string): string {
    // TODO: THIS LIST NEEDS TO EXTEND
    return text
      .replace(/\bSoftware Engineer\b/gi, "SWE")
      .replace(/\bFull Stack\b/gi, "FS")
      .replace(/\bFront End\b/gi, "FE")
      .replace(/\bBack End\b/gi, "BE")
      .replace(/\bSan Francisco\b/gi, "SF")
      .substring(0, 30); // Truncate long keywords
  }
}
