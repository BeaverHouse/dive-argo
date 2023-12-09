---
sidebar_position: 1
---

# Workflow 기본

Workflow UI를 둘러보고, 간단한 Workflow를 직접 생성하고 실행해 봅시다.

## Workflow 리스트 보기

Argo Workflows에 로그인하면 첫 페이지에서 Workflow 리스트를 확인할 수 있습니다.  
그런데 default로 설정되어 있을 수 있는 `undefined` 를 포함하여 `argo-wf` 외의 다른 Namespace가 선택되어 있으면 다음처럼 오류가 발생합니다.

![error](img/3-2-listerror.png)

이는 설정한 ServiceAccount가 `argo-wf` Namespace에 만들어져 해당 Namespace 내에서만 권한을 가지고 있기 때문입니다.

![normal](img/3-2-listnormal.png)

Namespace를 `argo-wf` 로 작성하면 에러가 사라집니다.  
이제 Workflow를 작성해 보겠습니다.

Workflow Template 메뉴에서 CREATE NEW WORKFLOW TEMPLATE을 누릅니다.

![create1](img/3-2-create1.png)

우선 Argo 문서의 샘플 Workflow를 약간 수정해서 사용하겠습니다.  
기존의 데이터를 지우고 아래 내용을 붙여넣습니다.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: whalesay-template
spec:
  templates:
    - name: whalesay
      inputs:
        parameters:
          - name: message
            value: "hello world"
      container:
        image: docker/whalesay
        command: [cowsay]
        args: ["{{inputs.parameters.message}}"]
```

CREATE를 누르면 Workflow Template이 만들어집니다.

![check](img/3-2-create2.png)

`kubectl` 로도 생성된 Template을 확인할 수 있습니다.

![kubectl check](img/3-2-create-kubectl.png)

Workflow도 생성해 보도록 하겠습니다.
Workflows 메뉴로 돌아가 SUBMIT NEW WORKFLOW 버튼을 누릅니다.

![Alt text](img/3-2-create4.png)

Edit using full workflow options를 선택하고 아래 내용을 붙여넣습니다.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: whalesay-workflow-
spec:
  entrypoint: whalesay
  templates:
    - name: whalesay
      steps:
        - - name: ref-template
            templateRef:
              name: whalesay-template
              template: whalesay
```

![Alt text](img/3-2-create5.png)

기다리면 Workflow가 실행되는 것을 확인할 수 있습니다.

![Alt text](img/3-2-create6.png)

그런데 Logs를 클릭해 보면 아무 내용이 나오지 않습니다. Workflow가 제대로 실행되지 않았을까요?

![Alt text](img/3-2-create7.png)

`kubectl` 로 확인해 보면 정상적으로 실행이 되었습니다.  
실제로 개발자 도구로 확인해 보면 로그를 불러오는 API가 403 Forbidden을 반환하는 것을 확인할 수 있습니다.

![Alt text](img/3-2-logerror.png)

이는 현재 ServiceAccount가 Pod에 관한 권한을 가지고 있지 않기 때문입니다.

```title="pod-reader.yaml"
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: {{ .Release.Namespace | quote }}
  name: pod-reader
rules:
  - apiGroups: [""] # "" indicates the core API group
    resources: ["pods", "pods/log"]
    verbs: ["get", "watch", "list"]
```

```title="rb-admin-pod.yaml"
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: huadmin-pod-rb
  namespace: {{ .Release.Namespace | quote }}
subjects:
  - kind: ServiceAccount
    name: huadmin
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

이후 `helm upgrade` 등으로 변경사항을 반영합니다.

다시 Workflow를 만들어 실행하고 로그를 확인하면 이번에는 정상적으로 출력됩니다.

![Alt text](img/3-2-create8.png)