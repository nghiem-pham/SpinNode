WITH job_templates AS (
    SELECT *
    FROM (
        VALUES
            ('Google', 'Senior Frontend Engineer', 'Mountain View, CA', 'Full-time', '$150,000 - $200,000', 'Build scalable web applications using React and TypeScript for high-traffic consumer surfaces.', 'React,TypeScript,System Design,Performance'),
            ('Meta', 'Full Stack Developer', 'Menlo Park, CA', 'Full-time', '$140,000 - $190,000', 'Work on social platform features across frontend and backend services.', 'React,Java,Distributed Systems,Product Sense'),
            ('Amazon', 'Backend Engineer', 'Seattle, WA', 'Full-time', '$130,000 - $180,000', 'Design and implement reliable backend services used across multiple internal teams.', 'Java,Spring Boot,PostgreSQL,AWS'),
            ('Apple', 'iOS Developer', 'Cupertino, CA', 'Full-time', '$145,000 - $195,000', 'Create polished mobile experiences with strong performance and accessibility foundations.', 'Swift,UIKit,Performance,Testing'),
            ('Netflix', 'DevOps Engineer', 'Los Gatos, CA', 'Full-time', '$135,000 - $185,000', 'Improve delivery pipelines and observability for globally distributed systems.', 'Kubernetes,AWS,Observability,CI/CD'),
            ('OpenAI', 'Machine Learning Engineer', 'San Francisco, CA', 'Full-time', '$160,000 - $220,000', 'Develop model infrastructure and evaluation workflows for production AI systems.', 'Python,PyTorch,Distributed Training,ML Systems'),
            ('Google', 'Staff Frontend Engineer', 'New York, NY', 'Hybrid', '$180,000 - $240,000', 'Lead architecture for modern web platforms with a focus on speed and maintainability.', 'React,Architecture,Leadership,Accessibility'),
            ('Meta', 'Platform Engineer', 'Remote', 'Full-time', '$155,000 - $210,000', 'Build platform primitives that support feature teams shipping quickly and safely.', 'Java,Platform,Microservices,Kafka'),
            ('Amazon', 'Cloud Infrastructure Engineer', 'Austin, TX', 'Full-time', '$145,000 - $195,000', 'Operate and evolve cloud infrastructure for internal developer tooling.', 'AWS,Terraform,Containers,Networking'),
            ('Apple', 'Mobile Platform Engineer', 'San Diego, CA', 'Hybrid', '$150,000 - $205,000', 'Build shared iOS platform capabilities used by multiple product teams.', 'Swift,SDK Design,Testing,CI'),
            ('Netflix', 'Site Reliability Engineer', 'Remote', 'Full-time', '$155,000 - $210,000', 'Increase resilience, monitoring quality, and incident response maturity.', 'SRE,Monitoring,Automation,Cloud'),
            ('OpenAI', 'Applied AI Engineer', 'San Francisco, CA', 'Full-time', '$170,000 - $230,000', 'Ship AI-powered user experiences with robust evaluation and product feedback loops.', 'Python,LLMs,Evaluation,Product Engineering')
    ) AS t(company_name, title, location, job_type, salary, description, requirements)
)
INSERT INTO jobs (
    company_id,
    title,
    location,
    job_type,
    salary,
    description,
    requirements,
    posted_at,
    featured_order
)
SELECT
    c.id,
    CONCAT(t.title, ' #', gs.n),
    t.location,
    t.job_type,
    t.salary,
    CONCAT(t.description, ' Opening batch ', gs.n, ' expands the seed catalog for deeper browsing.'),
    t.requirements,
    now() - ((gs.n * 3 + row_number() OVER ()) || ' hours')::interval,
    100 + gs.n
FROM generate_series(1, 250) AS gs(n)
JOIN job_templates t ON TRUE
JOIN companies c ON c.name = t.company_name;
