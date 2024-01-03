---
sidebar_position: 3
---

# Workflow를 Argo CD로 제어하기

```yaml title="sample-wf.yaml"
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: remote-template-sample
spec:
  templates:
    - name: whalesay
      inputs:
        parameters:
          - name: message
            value: "it is from Github"
      container:
        image: docker/whalesay
        command: [cowsay]
        args: ["{{inputs.parameters.message}}"]
```

![Alt text](img/5-3-create-prj.png)

새 프로젝트 생성

![Alt text](img/5-3-add-ns.png)

![Alt text](img/5-3-add-source.png)

설정

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: sample-workflow
spec:
  destination:
    name: ""
    namespace: argo-wf
    server: "https://kubernetes.default.svc"
  source:
    path: step5-3
    repoURL: "https://github.com/BeaverHouse/dive-argo-practice-files.git"
    targetRevision: main
  sources: []
  project: argo-test
  syncPolicy:
    automated: null
    syncOptions: []
```

![Alt text](img/5-3-syncout.png)

![Alt text](img/5-3-no-wf.png)

![Alt text](img/5-3-sync-manual.png)

![Alt text](img/5-3-sync-ok.png)

![Alt text](img/5-3-wf-created.png)

![Alt text](img/5-3-wf-check-argo.png)

![Alt text](img/5-3-wf-check-argo-2.png)

![Alt text](img/5-3-push.png)

![Alt text](img/5-3-update-syncout.png)

![Alt text](image-12.png)

![Alt text](image-13.png)
