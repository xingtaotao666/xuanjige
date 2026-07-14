export interface RagSource {
  book: string;
  text: string;
  score: number;
}

export interface ConsultResponse {
  answer: string;
  sources: RagSource[];
}
