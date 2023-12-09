---
sidebar_position: 3
---

# Workflow 응용

기본적인 Workflow 생성법을 알았으니, 여러 가지 Workflow를 만들어 보겠습니다.  

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: python-script-workflow
spec:
  entrypoint: sum-random-ten
  templates:
    - name: sum-random-ten
      script:
        image: python:alpine3.8
        command: [python]
        source: |
            import random

            sum = 0
            for _ in range(10):
                i = random.randint(1, 100)
                print(i)
                sum += i
            print(sum)
```

![script](img/3-3-script.png)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: python-wf-with-variables
spec:
  entrypoint: sum-random-n
  arguments:
    parameters:
    - name: count-from-workflow
  templates:
    - name: sum-random-n
      inputs:
        parameters:
          - name: count
            value: "{{workflow.parameters.count-from-workflow}}"
      script:
        image: python:alpine3.8
        command: [python]
        source: |
            import random

            sum = 0
            n = {{inputs.parameters.count}}
            for _ in range(n):
                i = random.randint(1, 100)
                print(i)
                sum += i
            print(sum)
```

![input as 5](img/3-3-script-w-variable.png)

![result](img/3-3-script-w-variable-result.png)