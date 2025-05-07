export interface LibrarianData {
  id: string;
  name: string;
  persona: string;
  mumblings: string[];
  encountered: boolean;
  imageKey: string;
  imageBase64?: string;
  obsession?: string;
}
