---
sidebar_position: 4
---

# CI Workflow 발전시키기

앞처럼 Github 등의 외부 서비스 Event를 받을 수 없으니  
Push 후 MinIO에 파일을 추가하는 것으로 수동 Event를 발생시키겠음

CI Workflow 수정

## Git Clone 수정

단순히 파일 확인만 했었는데
이제 가장 최근의 태그를 읽어 와서 이를 `version.txt`에 저장하고 실제 이미지 태그에 사용

![github-tag](img/4-4-github-tag.png)

```yaml title="git-clone.yaml" {24-29}
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: git-clone
spec:
  serviceAccountName: huadmin
  templates:
  - name: checkout
    inputs:
      parameters:
        - name: git-url
        - name: revision
          value: "main"
      artifacts:
      - name: source-code
        path: /code
        git:
          repo: "{{inputs.parameters.git-url}}"
          revision: "{{inputs.parameters.revision}}"
    outputs:
      artifacts:
      - name: source-code
        path: /code
      parameters:
      - name: image-tag
        valueFrom:
          path: /code/version.txt
    script:
      image: bitnami/git:2.43.0
      workingDir: /code
      command: [bash]
      source: |
        git describe --tags --abbrev=0 > version.txt
```

![clone part success](img/4-4-clone-part.png)

![file check](img/4-4-file-check.png)

## Helm Chart 작성
https://github.com/BeaverHouse/dive-argo-fastapi-helm

![helm-sample](img/4-4-helm-sample.png)

:::info
이것은 root path가 `/`인 경우임
FastAPI의 경우에는 다음 링크를 참고
https://fastapi.tiangolo.com/advanced/behind-a-proxy/
https://stackoverflow.com/questions/60397218/fastapi-docs-not-working-with-nginx-ingress-controller

다른 앱도 sub-path에 배포하고 싶다면 설정 변경이 필요할 수 있다
:::

## Github 토큰 생성
https://github.com/settings/tokens/new

https://argoproj.github.io/argo-events/eventsources/setup/github/

![github-token](img/4-4-github-token.png)

```
echo -n <api-token-key> | base64
```

```yaml title="github-access.yaml"
apiVersion: v1
kind: Secret
metadata:
  name: github-access
type: Opaque
data:
  token: <base64-encoded-api-token-from-previous-step>
```

`helm upgrade`


```yaml title="chart-push.yaml" {24-29}
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: chart-push
spec:
  serviceAccountName: huadmin
  templates:
  - name: change-push
    inputs:
      parameters:
        - name: image-tag
        - name: github-user
          value: "HU-Lee"
        - name: repository
          value: "BeaverHouse/dive-argo-fastapi-helm"
        - name: revision
          value: "main"
    script:
      image: guidoffm/yq-git:latest
      env:
      - name: GITHUB_TOKEN
        valueFrom:
          secretKeyRef:
            name: github-access
            key: token
      command: [bash]
      workingDir: /code
      source: |
        git clone https://{{inputs.parameters.github-user}}:$GITHUB_TOKEN@github.com/{{inputs.parameters.repository}}.git --branch {{inputs.parameters.revision}} . 

        ls
        pwd

        git config --global user.name "HU-Lee (Argo)"
        git config --global user.email "haulrest@gmail.com"

        yq e -i '.image.tag = "{{inputs.parameters.image-tag}}"' fastapi-argo/values.yaml

        git add .
        git commit -m "change image tag to {{inputs.parameters.image-tag}}"

        git push origin {{inputs.parameters.revision}}
```
https://github.com/mikefarah/yq

![push check](img/4-4-push-check.png)

## 전체 Workflow 작성하여 Sensor에 연결하기

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Sensor
metadata:
  name: argo-ci-sensor
spec:
  eventBusName: eventbus-jetstream
  template:
    serviceAccountName: huadmin
  dependencies:
    - name: minio-input
      eventSourceName: minio-event
      eventName: files
  triggers:
    - template:
        name: ci-trigger
        k8s:
          operation: create
          source:
            resource:
              apiVersion: argoproj.io/v1alpha1
              kind: Workflow
              metadata:
                generateName: argo-ci-
              spec:
                serviceAccountName: huadmin
                entrypoint: total-wf
                arguments:
                  parameters:
                  - name: git-url
                    value: https://github.com/BeaverHouse/dive-argo-fastapi
                  - name: FROM_ARGO
                    value: from argo-events
                  - name: image_name
                    value: fastapi-sample
                templates:
                - name: total-wf
                  dag:
                    tasks:
                    - name: clone
                      arguments:
                        parameters:
                          - name: git-url
                            value: "{{workflow.parameters.git-url}}"
                      templateRef:
                        name: git-clone
                        template: checkout
                    - name: kaniko-process
                      dependencies: [clone]
                      arguments:
                        parameters:
                          - name: FROM_ARGO
                            value: "{{workflow.parameters.FROM_ARGO}}"
                          - name: image_name
                            value: "{{workflow.parameters.image_name}}"
                          - name: image_tag
                            value: "{{tasks.clone.outputs.parameters.image-tag}}"
                        artifacts:
                        - name: source-code
                          from: "{{tasks.clone.outputs.artifacts.source-code}}"
                      templateRef:
                        name: image-build
                        template: build-push
                    - name: helm-push
                      dependencies: [kaniko-process]
                      arguments:
                        parameters:
                          - name: image-tag
                            value: "{{tasks.clone.outputs.parameters.image-tag}}"
                      templateRef:
                        name: chart-push
                        template: change-push
      retryStrategy:
        steps: 3
```

![event flow](img/4-4-event-flow.png)

이벤트 실행

![wf trigger](img/4-4-wf-trigger.png)
![hub check](img/4-4-docker-hub.png)
![push check](img/4-4-git-push.png)