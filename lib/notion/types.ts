export type DatabaseKey = "brands" | "sources" | "inputs" | "contents" | "platforms";

export type OptionColor =
  | "default"
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red";

export type NotionOption = {
  id: string;
  name: string;
  color: OptionColor;
};

export type NotionSchemas = {
  status: Partial<Record<DatabaseKey, NotionOption[]>>;
  format: Partial<Record<DatabaseKey, NotionOption[]>>;
};

export type Brand = {
  id: string;
  url: string;
  name: string;
  status: string;
  statusColor: OptionColor;
  niche: string;
  target: string;
  tone: string;
  ideaPrompt: string;
  scriptPrompt: string;
  imagePrompt: string;
  platforms: string[];
  inputIds: string[];
};

export type Source = {
  id: string;
  url: string;
  name: string;
  tags: string[];
  details: string;
  brandIds: string[];
  inputIds: string[];
  links: {
    url: string;
    tiktok: string;
    instagram: string;
    youtube: string;
    pinterest: string;
    website: string;
  };
};

export type InputContent = {
  id: string;
  url: string;
  title: string;
  status: string;
  statusColor: OptionColor;
  details: string;
  script: string;
  caption: string;
  formats: string[];
  brandIds: string[];
  accountName: string;
  sourceIds: string[];
  externalUrl: string;
};

export type ContentItem = {
  id: string;
  url: string;
  title: string;
  status: string;
  statusColor: OptionColor;
  format: string;
  brandIds: string[];
  platformIds: string[];
  inputIds: string[];
  sceneIds: string[];
  script: string;
  description: string;
  canvaUrl: string;
  externalUrl: string;
  date: string;
  hasFiles: boolean;
};

export type Platform = {
  id: string;
  url: string;
  name: string;
  brandIds: string[];
  contentIds: string[];
};

export type BootstrapData = {
  brands: Brand[];
  sources: Source[];
  inputs: InputContent[];
  contents: ContentItem[];
  platforms: Platform[];
  schemas: NotionSchemas;
  pageTitles: Record<string, string>;
  warnings: string[];
  updatedAt: string;
};

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };
