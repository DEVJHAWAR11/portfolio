import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from '@/components/page-header';
import Pager from '@/components/pager';

const AboutMePage = () => {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>About Dev</PageHeaderHeading>
        <PageHeaderHeading className="mt-2 text-muted-foreground">
          Turning complex problems into scalable AI systems.
        </PageHeaderHeading>
        <PageHeaderDescription>
          I specialize in designing intelligent, production-ready backend systems that transform data into meaningful outcomes. What began as an interest in solving problems through code has evolved into building scalable applications powered by machine learning and modern backend architecture.
        </PageHeaderDescription>
        <PageHeaderDescription>
          With a strong foundation in backend development and ML, I work on RAG pipelines, LLM-powered systems, and scalable APIs, focusing on performance, reliability, and real-world usability. I am continuously exploring system design, distributed systems, and advanced machine learning to push my technical boundaries.
        </PageHeaderDescription>
        <PageHeaderDescription>
          I enjoy tackling complex challenges, building end-to-end systems, and contributing to projects that deliver tangible value.
        </PageHeaderDescription>
      </PageHeader>

      <Pager
        prevHref="/"
        nextHref="/projects"
        prevTitle="Introduction"
        nextTitle="Projects"
      />
    </>
  );
};
export default AboutMePage;
