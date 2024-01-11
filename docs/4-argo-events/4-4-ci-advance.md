---
sidebar_position: 4
---

# CI pipeline 발전시키기

이 문서에서는 기존에 작성한 CI Workflow에 Argo Events를 추가하여 발전된 형태의 CI pipeline을 구축해 보겠습니다.

:::caution
원래는 Github 등의 서비스에서 Push 등의 이벤트를 받는 것이 일반적이지만,  
Github 등의 외부 서비스에서 이벤트를 수신하기 위해서는 서비스가 공개 IP 등으로 노출되어야 하는데 현재 테스트 환경은 보안 관련 설정이 없기 때문에 리스크가 존재합니다.

그래서 이 문서에서는 Github push는 따로 진행하고, MinIO에 수동으로 파일을 추가하는 것으로 Event를 발생시키겠습니다.
:::

## Git clone 수정

기존 Git clone 단계에서는 단순히 파일 확인만 수행했지만, 이번에는 가장 최근의 태그를 읽어 와서 이를 `version.txt` 파일에 저장하고 실제 태그 설정에 활용하겠습니다.  
Github 등 다른 서비스를 연결할 경우, 다른 방식으로 변경할 수도 있을 것입니다.

예시 Repository에는 다음과 같이 태그를 설정해 두었습니다.

![Set tag to Github repo](img/4-4-github-tag.png)

이제 기존 WorkflowTemplate을 다음과 같이 변경합니다.

<!-- prettier-ignore -->
```yaml title="git-clone.yaml" {24-33}
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

변경된 Workflow를 실행 후 결과물을 확인해 보면 추가로 `version.txt` 파일이 생성되고, 최신 태그인 `1.0.0` 값이 적힌 것을 확인할 수 있습니다.

![Clone success](img/4-4-clone-success.png)

![Clone output file check](img/4-4-clone-output-check.png)

이 값과 소스 코드는 Output으로 설정하여 이후 단계에서 활용할 수 있습니다.

## Helm chart 이미지 태그 자동 변경

이제 Git clone - Kaniko build 수행 후 이미지 태그를 Helm chart에 자동으로 반영하도록 추가 Workflow를 작성하겠습니다.

### 샘플 Helm chart 작성

우선, 샘플 앱에 대한 Helm chart가 없기 때문에 별도의 Repository에 생성하겠습니다.  
Helm chart에 대한 세부 내용은 여기서 다루지 않습니다.

https://github.com/BeaverHouse/dive-argo-fastapi-helm

![Sample Helm chart test](img/4-4-helm-sample-test.png)

Ingress Controller를 통해 간이로 테스트까지 완료한 모습입니다.

:::info
여기서 사용된 샘플 앱과 Helm chart는 base path가 `/` 로 설정되어 있습니다.  
만약 다른 base path에 배포하고 싶다면, 앱과 Helm chart 설정 변경이 필요할 수 있습니다.

FastAPI의 경우에는 다음 링크를 참고해 주세요.  
https://fastapi.tiangolo.com/advanced/behind-a-proxy/  
https://stackoverflow.com/q/60397218
:::

### Github token 생성

Github 소스를 수정하기 위해서는 권한이 필요합니다.  
따로 계정을 설정하지 않고, token을 발급하여 소스를 제어할 수 있습니다.[^1]

아래 링크에서 token을 생성합니다.  
https://github.com/settings/tokens/new

이름과 repo 권한을 설정해 주고 token을 발급합니다.

![Generate Github token](img/4-4-generate-token.png)

이제 이 token 값을 Base64로 암호화합니다.

```
echo -n <api-token-key> | base64
```

이 암호화된 값을 활용해 Helm chart에 Secret 파일을 작성합니다.

```yaml title="github-access.yaml"
apiVersion: v1
kind: Secret
metadata:
  name: github-access
type: Opaque
data:
  token: <base64-encoded-api-token-from-previous-step>
```

이후 `helm upgrade` 명령어로 변경사항을 반영합니다.

### Workflow 작성

이제 실제 Helm chart를 변경하는 부분을 작성하겠습니다.

<!-- prettier-ignore -->
```yaml title="chart-push.yaml" {20-25,29,37}
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

중요하게 보아야 할 곳은 크게 3군데입니다.

- API token 값을 Secret에서 불러와야 합니다.
- `git clone` 시 위와 같이 token 값을 활용해야 소스 제어를 할 수 있습니다.
- `.yaml` 파일은 [yq][yq]를 통해 수정합니다.

Workflow를 저장한 후 테스트를 통해 정상적으로 태그가 변경되는지 확인합니다.

![Repository push check](img/4-4-push-check.png)

## Sensor로 전체 Workflow 실행하기

이제 위의 모든 단계를 연결한 전체 Workflow를 Sensor에 작성합니다.

<!-- prettier-ignore -->
```yaml {13-75}
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

이벤트 정보는 활용하지 않을 것이기 때문에 관련 내용은 삭제하고,  
trigger된 Workflow는 바로 실행되어야 하므로 필요한 값을 미리 명시해 두었습니다.

저장을 한 뒤에 다음과 같은 Event Flow를 확인할 수 있습니다.

![Event flow](img/4-4-event-flow.png)

## CI pipeline 테스트

이제 다시 MinIO에서 파일을 통해 이벤트를 발생시킵니다.  
Workflow가 정상적으로 실행되는 것을 확인할 수 있습니다.

![Workflow triggered](img/4-4-wf-trigger.png)

Docker Hub에도 `1.0.0` 태그의 새로운 이미지가 업로드되었습니다.

![Docker Hub check](img/4-4-docker-hub-check.png)

마지막으로 Github에도 태그가 `1.0.0` 값으로 반영된 것을 확인할 수 있습니다.

![Repository push check (by event)](img/4-4-event-push-check.png)

<br/>

[^1]: https://argoproj.github.io/argo-events/eventsources/setup/github/

[yq]: https://github.com/mikefarah/yq
