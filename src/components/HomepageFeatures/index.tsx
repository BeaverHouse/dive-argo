import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";
import Translate, { translate } from "@docusaurus/Translate";
import React from "react";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
};

const sub1Title = "K8S 환경 구성";
const sub1Desc =
  "Argo 앱을 배포하고 접근하기 위한 기본적인 Kubernetes 환경을 구성해 봅니다.";
const sub2Title = "Argo 체험하기";
const sub2Desc =
  "Argo Workflows와 Argo CD를 중심으로 Argo의 여러 기능을 실제로 사용해 봅니다.";

const FeatureList: FeatureItem[] = [
  {
    title: translate({
      id: "subject-1",
      message: sub1Title,
      description: "Title for subject 1",
    }),
    Svg: require("@site/static/img/k8s.svg").default,
    description: <Translate id="subject-description-1">{sub1Desc}</Translate>,
  },
  {
    title: translate({
      id: "subject-2",
      message: sub2Title,
      description: "Title for subject 2",
    }),
    Svg: require("@site/static/img/argo.svg").default,
    description: <Translate id="subject-description-2">{sub2Desc}</Translate>,
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div style={{ margin: "0 auto" }} className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
