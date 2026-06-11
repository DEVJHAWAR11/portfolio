import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from '@/components/page-header';
import Pager from '@/components/pager';
import TimelineViewer from '@/components/timeline-viewer';
import { education } from '@/constants/education';

const EducationPage = () => {
  return (
    <>
      <PageHeader className="mb-10">
        <PageHeaderHeading>Education</PageHeaderHeading>
        <PageHeaderHeading className="mt-2 text-muted-foreground">
          The best lessons weren't in textbooks—they were in debugging sessions.
        </PageHeaderHeading>
        <PageHeaderDescription>
          Building a strong foundation in Computer Science through academics, projects, and hands-on engineering.
        </PageHeaderDescription>

        <PageHeaderDescription>
          Currently pursuing a Bachelor of Technology in Computer Science at KIIT University. Alongside coursework, I focus on backend engineering, AI systems, distributed applications, and problem solving through real-world projects and competitive programming.
        </PageHeaderDescription>
      </PageHeader>

      <TimelineViewer data={education} />

      <Pager
        prevHref="/skills-tools"
        nextHref="/contact"
        prevTitle="Skills & Tools"
        nextTitle="Contact"
      />
    </>
  );
};
export default EducationPage;
